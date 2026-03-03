import type { NextFunction, Request, Response } from 'express';
import { redisClient as redis } from '@/shared/redisClient';
import { PrismaTransactionManager, type PrismaTransaction } from '@/shared/prisma';
import { getClientId } from '@/shared/utils/cognito';
import { cognitoIdentityClient } from '@/shared/utils/cognito';
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/shared/utils/cookieUtils';
import { cognitoProvider } from '../../providers/authProvider';
import { tokenProvider } from '../../providers/tokenProvider';
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

export const acceptInviteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId, userPoolId } = await getClientId();
    const authProvider = cognitoProvider({ client: cognitoIdentityClient, userPoolId, clientId });
    const transactionManager = new PrismaTransactionManager();

    const result = await signupInvitedUserUseCase(req.body, {
      authProvider,
      transactionManager,
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

    // Generate tokens after successful invite acceptance
    const tokenProviderInstance = tokenProvider({ client: redis });
    const { accessToken, refreshToken } = await tokenProviderInstance.createSession({
      userId: result.user.userId,
      organizationId: result.tenant.tenantId,
      orgSlug: result.tenant.slug,
      membershipId: result.tenant.membershipId,
      role: result.user.role,
      orgSubscriptionTier: result.tenant.subscriptionTier,
      orgStatus: result.tenant.status,
    });

    // Set both tokens as HttpOnly cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({ message: 'Signup successful', ...result });
  } catch (error) {
    return next(error);
  }
};

export default acceptInviteController;
