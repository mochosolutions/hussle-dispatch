import type { Request, Response } from 'express';
import { auditLogRepositoryPrisma } from '../../../audit/repositories/auditLogRepositoryPrisma';
import { redisClient as redis } from '@/shared/redisClient';
import { prisma } from '@/shared/prisma';
import { getClientId } from '@/shared/utils/cognito';
import { cognitoIdentityClient } from '@/shared/utils/cognito';
import { AuthStatus } from '@/shared/constants/authConstants';
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/shared/utils/cookieUtils';
import { decodeToken } from '@/shared/utils/cognito';
import { cognitoProvider } from '../../providers/authProvider';
import { tokenProvider } from '../../providers/tokenProvider';
import { membershipRepositoryPrisma } from '../../repositories/membershipRepositoryPrisma';
import { userRepositoryPrisma } from '../../repositories/userRepositoryPrisma';
import { authenticateUserService } from '../../services';

/* eslint-disable max-statements, complexity, @typescript-eslint/no-unsafe-assignment,
   @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access,
   @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-explicit-any */
// TODO: Refactor loginController to reduce complexity and improve type safety
export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ status: 'error', error: 'Email and password are required' });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const { clientId, userPoolId } = await getClientId();
    const authProvider = cognitoProvider({
      client: cognitoIdentityClient,
      userPoolId,
      clientId,
    });
    const tokenProviderInstance = tokenProvider({ client: redis, singleSession: true });
    const memershipRepo = membershipRepositoryPrisma(prisma);
    const userRepo = userRepositoryPrisma(prisma);

    const authResponse = await authenticateUserService(
      { username: normalizedEmail, password },
      {
        decodeToken,
        authProvider,
        tokenProvider: tokenProviderInstance,
        findMemberByUserId: memershipRepo.findMembershipsByUserId,
        findUserByExternalId: userRepo.findUserByExternalId,
      }
    );

    const { status, user, token, session, challengeName, orgs } = authResponse;

    if (status === AuthStatus.AUTHENTICATED && token?.refreshToken) {
      // Set HttpOnly cookies for both tokens
      setAccessTokenCookie(res, token.accessToken);
      setRefreshTokenCookie(res, token.refreshToken);

      // Audit log for user login (fire-and-forget)
      if (user.organizationId && user.id) {
        const auditLogRepo = auditLogRepositoryPrisma(prisma, user.organizationId);
        auditLogRepo
          .create({
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
        status: 'authenticated',
        message: 'User authenticated successfully',
      });
    }
    if (status === AuthStatus.AUTHENTICATED) {
      // Handle the case where we're authenticated but don't have a refresh token
      if (token?.accessToken) {
        setAccessTokenCookie(res, token.accessToken);
      }

      return res.status(200).json({
        user,
        accessibleOrgs: orgs,
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
        canResendCode: true, // Frontend can offer resend option
      });
    }
    return res.status(401).json({
      status: 'unauthenticated',
      message: 'Authentication failed',
    });
  } catch (error: unknown) {
    const isAuthError =
      error instanceof Error &&
      'code' in error &&
      (error.code === 'UserNotFoundException' || error.code === 'NotAuthorizedException');

    if (isAuthError) {
      return res.status(401).json({
        status: 'unauthenticated',
        error: 'Invalid email or password',
      });
    }
    throw error;
  }
};
/* eslint-enable max-statements, complexity, @typescript-eslint/no-unsafe-assignment,
   @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access,
   @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-explicit-any */

export default loginController;
