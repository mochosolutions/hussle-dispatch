import type { NextFunction, Request, Response } from 'express';
import { auditLogRepositoryPrisma } from '../../../audit/repositories/auditLogRepositoryPrisma';
import { redisClient as redis } from '@/shared/redisClient';
import { PrismaTransactionManager, type PrismaTransaction } from '@/shared/prisma';
import { prisma } from '@/shared/prisma';
import { getClientId } from '@/shared/utils/cognito';
import { cognitoIdentityClient } from '@/shared/utils/cognito';
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/shared/utils/cookieUtils';
import { cognitoProvider } from '../../providers/authProvider';
import { tokenProvider } from '../../providers/tokenProvider';
import { membershipRepositoryPrisma } from '../../repositories/membershipRepositoryPrisma';
import { organizationRepositoryPrisma } from '../../repositories/organizationRepositoryPrisma';
import { userRepositoryPrisma } from '../../repositories/userRepositoryPrisma';
import {
  signupOrganizationUseCase,
  createOrganizationService,
  createUserService,
  createMembershipService,
} from '../../services';
import type { CreateMembershipInput } from '../../types/membershipTypes';
import type { CreateOrganizationInput } from '../../types/organizationTypes';
import type { SignupOrgInput } from '../../types/signupOrgTypes';
import type { CreateUserInput } from '../../types/user';

export const signupOrgController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId, userPoolId } = await getClientId();
    const authProvider = cognitoProvider({ client: cognitoIdentityClient, userPoolId, clientId });
    const transactionManager = new PrismaTransactionManager();

    // req.body validated by Yup middleware, safe to type assert
    const signupData = req.body as SignupOrgInput;

    const result = await signupOrganizationUseCase(signupData, {
      authProvider,
      transactionManager,
      createOrgService: (data: CreateOrganizationInput, tx: PrismaTransaction) => {
        const orgRepo = organizationRepositoryPrisma(tx);
        return createOrganizationService(data, {
          create: orgRepo.createOrganization,
          findByName: orgRepo.findOrganizationByName,
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
    });

    // Generate tokens after successful signup
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

    // Audit log for user signup (fire-and-forget)
    const auditLogRepo = auditLogRepositoryPrisma(prisma, result.tenant.tenantId);
    auditLogRepo
      .create({
        userId: result.user.userId,
        action: 'CREATE',
        entityType: 'User',
        entityId: result.user.userId,
        changes: null,
        metadata: {
          email: result.user.email,
          organizationName: result.tenant.name,
          action: 'signup',
        },
      })
      .catch(() => {
        // Audit failure should not block user flow
      });

    return res.status(201).json({ message: 'Signup successful', ...result });
  } catch (error) {
    return next(error);
  }
};

export default signupOrgController;
