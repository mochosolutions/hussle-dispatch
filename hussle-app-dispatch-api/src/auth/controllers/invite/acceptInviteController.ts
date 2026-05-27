import type { Request, Response } from 'express';
import type { PrismaTransaction } from '@/shared/prisma';
import { getClientId } from '@/shared/utils/cognito';
import { cognitoIdentityClient } from '@/shared/utils/cognito';
import {
  generateCsrfToken,
  setAccessTokenCookie,
  setCsrfTokenCookie,
  setRefreshTokenCookie,
} from '@/shared/utils/cookieUtils';
import { cognitoProvider } from '../../providers/authProvider';
import type { ITokenProvider } from '../../types/tokenProvider';
import { inviteRepositoryPrisma } from '../../repositories/inviteRepositoryPrisma';
import { membershipRepositoryPrisma } from '../../repositories/membershipRepositoryPrisma';
import { organizationRepositoryPrisma } from '../../repositories/organizationRepositoryPrisma';
import { userRepositoryPrisma } from '../../repositories/userRepositoryPrisma';
import {
  signupInvitedUserUseCase,
  createUserService,
  createMembershipService,
  acceptInvitationService as invitationAcceptService,
} from '../../services';
import type { AcceptInvitationInput } from '../../services';
import type { CreateMembershipInput } from '../../types/membershipTypes';
import type { CreateUserInput } from '../../types/user';
import { acceptInviteMapper } from './mappers/acceptInviteMapper';

interface AcceptInviteControllerDeps {
  transactionManager: {
    runInTransaction: <T>(fn: (tx: PrismaTransaction) => Promise<T>) => Promise<T>;
  };
  getAuthProvider: () => Promise<ReturnType<typeof cognitoProvider>>;
  tokenProviderInstance: ITokenProvider;
}

export const createAcceptInviteController =
  (deps: AcceptInviteControllerDeps) =>
  async (req: Request, res: Response) => {
    const input = acceptInviteMapper(req);

    const { clientId, userPoolId } = await getClientId();
    const authProvider = cognitoProvider({ client: cognitoIdentityClient, userPoolId, clientId });

    const result = await signupInvitedUserUseCase(input, {
      authProvider,
      transactionManager: deps.transactionManager,
      acceptInvitationService: (data: AcceptInvitationInput, tx: PrismaTransaction) => {
        const inviteRepo = inviteRepositoryPrisma(tx);
        return invitationAcceptService(data, {
          findOneByFilter: inviteRepo.findOneByFilter,
          updateInvite: inviteRepo.updateInvite,
        });
      },
      createUserService: (data: CreateUserInput, tx: PrismaTransaction) => {
        const userRepo = userRepositoryPrisma(tx);
        return createUserService(data, {
          create: userRepo.createUser,
          findByEmail: userRepo.findUserByEmail,
        });
      },
      createMembershipService: (data: CreateMembershipInput, tx: PrismaTransaction) => {
        const membershipRepo = membershipRepositoryPrisma(tx);
        return createMembershipService(data, {
          create: membershipRepo.create,
          findOneByFilter: membershipRepo.findOneByFilter,
        });
      },
      findOrganizationById: (id: string, tx: PrismaTransaction) => {
        const orgRepo = organizationRepositoryPrisma(tx);
        return orgRepo.findOrganizationById(id);
      },
    });

    const { accessToken, refreshToken } = await deps.tokenProviderInstance.createSession({
      userId: result.user.userId,
      organizationId: result.tenant.tenantId,
      orgSlug: result.tenant.slug,
      membershipId: result.tenant.membershipId,
      role: result.user.role,
      orgSubscriptionTier: result.tenant.subscriptionTier,
      orgStatus: result.tenant.status,
    });

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
    setCsrfTokenCookie(res, generateCsrfToken());

    return res.status(201).json({ message: 'Signup successful', ...result });
  };
