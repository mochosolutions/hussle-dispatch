import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import { createAuthControllers, type AuthControllers } from './controllers';
import { PrismaTransactionManager, type PrismaTransaction } from '@/shared/prisma';
import { getClientId } from '@/shared/utils/cognito';
import { cognitoIdentityClient } from '@/shared/utils/cognito';
import { cognitoProvider } from './providers/authProvider';
import { inviteRepositoryPrisma } from './repositories/inviteRepositoryPrisma';
import { membershipRepositoryPrisma } from './repositories/membershipRepositoryPrisma';
import { organizationRepositoryPrisma } from './repositories/organizationRepositoryPrisma';
import { userRepositoryPrisma } from './repositories/userRepositoryPrisma';
import { tokenProvider } from './providers/tokenProvider';
import { signupOrganizationUseCase } from './services';
import type { SignupOrgInput, SignupOrgResult } from './types/signupOrgTypes';
import type { AuthEnumConfig } from './types/authEnumConfig';
import { createSignupOrgValidator } from './validators/signupOrgValidator';
import { createUpdateOrganizationValidator } from './validators';
import { createBulkOrgValidators } from './validators/bulkOrgValidator';
import type { AuditLogPort } from './types/auditLogPort';
import { createSubscriptionUsageService } from './services/subscription/subscriptionUsageService';
import { createMemberManagementService } from './services/membership/memberManagementService';
import { carrierInviteTokenRepoPrisma } from '@/carrier-portal/repositories/carrierInviteTokenRepoPrisma';

interface AuthModuleConfig {
  allowedRoles: string[];
  defaultOrgRole: string;
}

interface AuthModuleDeps {
  prismaClient: PrismaClient;
  redisClient: Redis;
  config: AuthModuleConfig;
  enumConfig: AuthEnumConfig;
  eventBus: EventBus;
  logger: Logger;
  auditLogRepo: AuditLogPort;
}

export interface AuthModuleValidators {
  signupRequestObjValidator: ReturnType<typeof createSignupOrgValidator>['signupRequestObjValidator'];
  updateOrganizationValidator: ReturnType<typeof createUpdateOrganizationValidator>;
  bulkOrgValidators: ReturnType<typeof createBulkOrgValidators>;
}

export const createAuthModule = ({
  prismaClient,
  redisClient,
  config,
  enumConfig,
  eventBus,
  logger,
  auditLogRepo,
}: AuthModuleDeps): {
  controllers: AuthControllers;
  validators: AuthModuleValidators;
} => {
  const transactionManager = new PrismaTransactionManager();

  // Create validators from enum config
  const { signupRequestObjValidator } = createSignupOrgValidator(enumConfig);
  const updateOrgValidator = createUpdateOrganizationValidator(enumConfig);
  const bulkOrgValidators = createBulkOrgValidators(enumConfig);

  const tokenProviderInstance = tokenProvider({ client: redisClient });
  const loginTokenProviderInstance = tokenProvider({ client: redisClient, singleSession: true });
  const signupTokenProviderInstance = tokenProvider({ client: redisClient });
  const refreshTokenProviderInstance = tokenProvider({ client: redisClient });

  const orgRepo = {
    createOrganization: (
      ...args: Parameters<ReturnType<typeof organizationRepositoryPrisma>['createOrganization']>
    ) => organizationRepositoryPrisma(prismaClient, undefined, enumConfig).createOrganization(...args),
    findAllOrganizations: (
      ...args: Parameters<ReturnType<typeof organizationRepositoryPrisma>['findAllOrganizations']>
    ) => organizationRepositoryPrisma(prismaClient, undefined, enumConfig).findAllOrganizations(...args),
    findOrganizationById: (
      ...args: Parameters<ReturnType<typeof organizationRepositoryPrisma>['findOrganizationById']>
    ) => organizationRepositoryPrisma(prismaClient, undefined, enumConfig).findOrganizationById(...args),
    updateOrganization: (
      ...args: Parameters<ReturnType<typeof organizationRepositoryPrisma>['updateOrganization']>
    ) => organizationRepositoryPrisma(prismaClient, undefined, enumConfig).updateOrganization(...args),
    deleteOrganization: (
      ...args: Parameters<ReturnType<typeof organizationRepositoryPrisma>['deleteOrganization']>
    ) => organizationRepositoryPrisma(prismaClient, undefined, enumConfig).deleteOrganization(...args),
  };

  const membershipRepo = {
    createMembership: (
      organizationId: string,
      data: Parameters<ReturnType<typeof membershipRepositoryPrisma>['create']>[0],
    ) => membershipRepositoryPrisma(prismaClient, organizationId, enumConfig).create(data),
    findMembershipByUserAndOrganization: (organizationId: string, userId: string) =>
      membershipRepositoryPrisma(prismaClient, organizationId, enumConfig).findOneByFilter({
        userId,
        organizationId,
      }),
    findMembershipsByOrganization: async (organizationId: string) => {
      const result = await membershipRepositoryPrisma(
        prismaClient,
        organizationId,
        enumConfig,
      ).findMembershipByOrg();

      return result ?? [];
    },
    deleteMembership: (organizationId: string, membershipId: string) =>
      membershipRepositoryPrisma(prismaClient, organizationId, enumConfig).deleteMembership(membershipId),
    updateMembership: (
      organizationId: string,
      membershipId: string,
      data: Parameters<ReturnType<typeof membershipRepositoryPrisma>['updateMembership']>[1],
    ) =>
      membershipRepositoryPrisma(prismaClient, organizationId, enumConfig).updateMembership(membershipId, data),
    findMembershipsByFilter: (organizationId: string, filter: Record<string, unknown>) =>
      membershipRepositoryPrisma(prismaClient, organizationId, enumConfig).findMembershipsByFilter(filter),
    findMembershipsByUserId: (userId: string) =>
      membershipRepositoryPrisma(prismaClient, undefined, enumConfig).findMembershipsByUserId(userId),
    countActive: (organizationId: string) =>
      membershipRepositoryPrisma(prismaClient, organizationId, enumConfig).countActiveByOrg(organizationId),
  };

  const inviteRepo = {
    findAllInvites: (organizationId: string) =>
      inviteRepositoryPrisma(prismaClient, organizationId).findAllInvites(),
    findInviteByFilter: (organizationId: string, filter: Record<string, unknown>) =>
      inviteRepositoryPrisma(prismaClient, organizationId).findInviteByFilter(filter),
    create: (
      data: Parameters<ReturnType<typeof inviteRepositoryPrisma>['create']>[0],
    ) => inviteRepositoryPrisma(prismaClient).create(data),
    findOneByFilter: (organizationId: string, filter: Record<string, unknown>) =>
      inviteRepositoryPrisma(prismaClient, organizationId).findOneByFilter(filter),
    updateInvite: (
      organizationId: string,
      id: string,
      data: Parameters<ReturnType<typeof inviteRepositoryPrisma>['updateInvite']>[1],
    ) => inviteRepositoryPrisma(prismaClient, organizationId).updateInvite(id, data),
    countPending: (organizationId: string) =>
      inviteRepositoryPrisma(prismaClient, organizationId).countPending(organizationId),
  };

  const userRepo = {
    findUserByEmail: (
      ...args: Parameters<ReturnType<typeof userRepositoryPrisma>['findUserByEmail']>
    ) => userRepositoryPrisma(prismaClient).findUserByEmail(...args),
    findUsersByEmails: (
      ...args: Parameters<ReturnType<typeof userRepositoryPrisma>['findUsersByEmails']>
    ) => userRepositoryPrisma(prismaClient).findUsersByEmails(...args),
    findUserByExternalId: (
      ...args: Parameters<ReturnType<typeof userRepositoryPrisma>['findUserByExternalId']>
    ) => userRepositoryPrisma(prismaClient).findUserByExternalId(...args),
    findUserByIdWithMemberships: (
      ...args: Parameters<ReturnType<typeof userRepositoryPrisma>['findUserByIdWithMemberships']>
    ) => userRepositoryPrisma(prismaClient).findUserByIdWithMemberships(...args),
  };

  const subscriptionUsageService = createSubscriptionUsageService({ prismaClient });

  const memberManagementService = createMemberManagementService({
    membershipRepository: {
      findMembershipsByFilter: (filter: Record<string, unknown>) => {
        const orgId = filter.organizationId as string | undefined;
        return membershipRepositoryPrisma(
          prismaClient,
          orgId,
          enumConfig,
        ).findMembershipsByFilter(filter);
      },
      findOneByFilter: (filter: Record<string, unknown>) => {
        const orgId = filter.organizationId as string | undefined;
        return membershipRepositoryPrisma(
          prismaClient,
          orgId,
          enumConfig,
        ).findOneByFilter(filter);
      },
      updateMembership: (id: string, data: Record<string, unknown>) =>
        membershipRepositoryPrisma(prismaClient, undefined, enumConfig).updateMembership(id, data),
    },
    tokenProvider: tokenProviderInstance,
  });

  const signupOrganization = async (data: SignupOrgInput): Promise<SignupOrgResult> => {
    const { clientId, userPoolId } = await getClientId();
    const authProvider = cognitoProvider({ client: cognitoIdentityClient, userPoolId, clientId });

    return signupOrganizationUseCase(data, {
      authProvider,
      transactionManager,
      organizationRepository: {
        create: (input, tx: PrismaTransaction) =>
          organizationRepositoryPrisma(tx, undefined, enumConfig).createOrganization(input),
        findSlugsWithPrefix: (slugPrefix: string) =>
          organizationRepositoryPrisma(prismaClient, undefined, enumConfig).findSlugsWithPrefix(slugPrefix),
      },
      userRepository: {
        create: (input, tx: PrismaTransaction) =>
          userRepositoryPrisma(tx).createUser(input),
      },
      membershipRepository: {
        create: (input, tx: PrismaTransaction) =>
          membershipRepositoryPrisma(tx, undefined, enumConfig).create(input),
      },
      config: { defaultOrgRole: config.defaultOrgRole },
    });
  };

  const carrierInviteTokenRepo = carrierInviteTokenRepoPrisma(prismaClient);

  const controllers = createAuthControllers({
    auditLogRepo,
    signupTokenProviderInstance,
    refreshTokenProviderInstance,
    orgRepo,
    membershipRepo,
    inviteRepo,
    userRepo,
    tokenProviderInstance,
    loginTokenProviderInstance,
    transactionManager,
    signupOrganization,
    allowedRoles: config.allowedRoles,
    eventBus,
    logger,
    config: { defaultOrgRole: config.defaultOrgRole },
    subscriptionUsageService,
    memberManagementService,
    revokeCarrierInviteTokensForOrg: carrierInviteTokenRepo.revokeByOrganizationId,
  });

  const validators: AuthModuleValidators = {
    signupRequestObjValidator,
    updateOrganizationValidator: updateOrgValidator,
    bulkOrgValidators,
  };

  return { controllers, validators };
};
