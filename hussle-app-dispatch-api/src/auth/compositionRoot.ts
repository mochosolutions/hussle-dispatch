import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
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
import { auditLogRepositoryPrisma } from '../audit/repositories/auditLogRepositoryPrisma';
import type { CreateAuditLogInput } from '../audit/types/auditTypes';

interface AuthModuleConfig {
  allowedRoles: string[];
  defaultOrgRole: string;
}

interface AuthModuleDeps {
  prismaClient: PrismaClient;
  redisClient: Redis;
  config: AuthModuleConfig;
}

export const createAuthModule = ({
  prismaClient,
  redisClient,
  config,
}: AuthModuleDeps): {
  controllers: AuthControllers;
} => {
  const transactionManager = new PrismaTransactionManager();

  const tokenProviderInstance = tokenProvider({ client: redisClient });
  const loginTokenProviderInstance = tokenProvider({ client: redisClient, singleSession: true });
  const signupTokenProviderInstance = tokenProvider({ client: redisClient });
  const refreshTokenProviderInstance = tokenProvider({ client: redisClient });

  const auditLogRepo = {
    create: (organizationId: string, input: CreateAuditLogInput) =>
      auditLogRepositoryPrisma(prismaClient, organizationId).create(input),
  };

  const orgRepo = {
    createOrganization: (
      ...args: Parameters<ReturnType<typeof organizationRepositoryPrisma>['createOrganization']>
    ) => organizationRepositoryPrisma(prismaClient).createOrganization(...args),
    findAllOrganizations: (
      ...args: Parameters<ReturnType<typeof organizationRepositoryPrisma>['findAllOrganizations']>
    ) => organizationRepositoryPrisma(prismaClient).findAllOrganizations(...args),
    findOrganizationById: (
      ...args: Parameters<ReturnType<typeof organizationRepositoryPrisma>['findOrganizationById']>
    ) => organizationRepositoryPrisma(prismaClient).findOrganizationById(...args),
    updateOrganization: (
      ...args: Parameters<ReturnType<typeof organizationRepositoryPrisma>['updateOrganization']>
    ) => organizationRepositoryPrisma(prismaClient).updateOrganization(...args),
    deleteOrganization: (
      ...args: Parameters<ReturnType<typeof organizationRepositoryPrisma>['deleteOrganization']>
    ) => organizationRepositoryPrisma(prismaClient).deleteOrganization(...args),
  };

  const membershipRepo = {
    createMembership: (
      organizationId: string,
      data: Parameters<ReturnType<typeof membershipRepositoryPrisma>['create']>[0],
    ) => membershipRepositoryPrisma(prismaClient, organizationId).create(data),
    findMembershipByUserAndOrganization: (organizationId: string, userId: string) =>
      membershipRepositoryPrisma(prismaClient, organizationId).findOneByFilter({
        userId,
        organizationId,
      }),
    findMembershipsByOrganization: async (organizationId: string) => {
      const result = await membershipRepositoryPrisma(
        prismaClient,
        organizationId,
      ).findMembershipByOrg();

      return result ?? [];
    },
    deleteMembership: (organizationId: string, membershipId: string) =>
      membershipRepositoryPrisma(prismaClient, organizationId).deleteMembership(membershipId),
    updateMembership: (
      organizationId: string,
      membershipId: string,
      data: Parameters<ReturnType<typeof membershipRepositoryPrisma>['updateMembership']>[1],
    ) =>
      membershipRepositoryPrisma(prismaClient, organizationId).updateMembership(membershipId, data),
    findMembershipsByFilter: (organizationId: string, filter: Record<string, unknown>) =>
      membershipRepositoryPrisma(prismaClient, organizationId).findMembershipsByFilter(filter),
    findMembershipsByUserId: (userId: string) =>
      membershipRepositoryPrisma(prismaClient).findMembershipsByUserId(userId),
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

  const signupOrganization = async (data: SignupOrgInput): Promise<SignupOrgResult> => {
    const { clientId, userPoolId } = await getClientId();
    const authProvider = cognitoProvider({ client: cognitoIdentityClient, userPoolId, clientId });

    return signupOrganizationUseCase(data, {
      authProvider,
      transactionManager,
      organizationRepository: {
        create: (signupPayload, tx: PrismaTransaction) => {
          const txOrgRepo = organizationRepositoryPrisma(tx);
          return txOrgRepo.createOrganizationWithUserMembership(signupPayload);
        },
      },
      config: { defaultOrgRole: config.defaultOrgRole },
    });
  };

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
  });

  return { controllers };
};
