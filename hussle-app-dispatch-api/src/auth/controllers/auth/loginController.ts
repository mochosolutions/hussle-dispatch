import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import type { CreateAuditLogInput } from '../../types/auditLogPort';
import { UnauthorizedError } from '@/shared/errors';
import { decodeToken } from '@/shared/utils/cognito';
import { AuthStatus } from '@/shared/constants/authConstants';
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/shared/utils/cookieUtils';
import { cognitoProvider } from '../../providers/authProvider';
import type { ITokenProvider } from '../../types/tokenProvider';
import type { Membership } from '../../types/membershipTypes';
import type { User } from '../../types/user';
import { authenticateUserService } from '../../services';
import { mapLoginRequest } from './mappers/mapLoginRequest';

interface LoginControllerDeps {
  membershipRepo: {
    findMembershipsByUserId: (userId: string) => Promise<Membership[] | null>;
  };
  userRepo: {
    findUserByExternalId: (externalId: string) => Promise<User | null>;
  };
  tokenProviderInstance: ITokenProvider;
  auditLogRepo: {
    create: (organizationId: string, input: CreateAuditLogInput) => Promise<unknown>;
  };
  getAuthProvider: () => Promise<ReturnType<typeof cognitoProvider>>;
}

export const createLoginController = ({
  membershipRepo,
  userRepo,
  tokenProviderInstance,
  auditLogRepo,
  getAuthProvider,
}: LoginControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const loginInput = mapLoginRequest(req);

    const authProvider = await getAuthProvider();

    const authResponse = await authenticateUserService(
      { username: loginInput.email, password: loginInput.password },
      {
        decodeToken,
        authProvider,
        tokenProvider: tokenProviderInstance,
        findMemberByUserId: membershipRepo.findMembershipsByUserId,
        findUserByExternalId: userRepo.findUserByExternalId,
      },
    );

    const { status, user, token, session, challengeName, orgs } = authResponse;

    if (status === AuthStatus.AUTHENTICATED && token?.refreshToken) {
      setAccessTokenCookie(res, token.accessToken);
      setRefreshTokenCookie(res, token.refreshToken);

      if (user.organizationId && user.id) {
        auditLogRepo
          .create(user.organizationId, {
            userId: user.id,
            action: 'LOGIN',
            entityType: 'User',
            entityId: user.id,
            changes: null,
            metadata: {
              loginMethod: 'password',
            },
          })
          .catch(() => {
            // Audit failure should not block user flow
          });
      }

      return res.status(200).json({
        user,
        accessibleOrgs: orgs,
        accessToken: token.accessToken,
        status: 'authenticated',
        message: 'User authenticated successfully',
      });
    }
    if (status === AuthStatus.AUTHENTICATED) {
      if (token?.accessToken) {
        setAccessTokenCookie(res, token.accessToken);
      }

      return res.status(200).json({
        user,
        accessibleOrgs: orgs,
        accessToken: token?.accessToken ?? null,
        status: 'authenticated',
        message: 'User authenticated successfully, but no refresh token available',
      });
    }
    if (status === AuthStatus.CHALLENGE_REQUIRED) {
      return res.status(200).json({
        status: 'CHALLENGE_REQUIRED',
        user,
        session,
        challengeName,
        message: 'User needs to respond to challenge',
      });
    }
    if (status === AuthStatus.UNCONFIRMED) {
      return res.status(200).json({
        status: 'UNCONFIRMED',
        user,
        message: 'Please verify your email address. Check your email for a verification code.',
        canResendCode: true,
      });
    }
    throw new UnauthorizedError('Authentication failed');
  };
