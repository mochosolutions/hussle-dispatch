import type { PrismaTransaction } from '@/shared/prisma';
import { logger } from '@/shared/utils/logger';
import { MembershipStatus } from '../../constants/enums';
import { BadRequestError } from '@mocho/common';
import { NotFoundError } from '@/shared/errors';
import type { Invite } from '../../types/invite';
import type { CreateMembershipInput, Membership } from '../../types/membershipTypes';
import type { Organization } from '../../types/organizationTypes';
import type { SignupOrgResult } from '../../types/signupOrgTypes';
import type { User, CreateUserInput } from '../../types/user';

export interface SignupInvitedUserUseCaseDeps {
  transactionManager: {
    runInTransaction: <T>(fn: (tx: PrismaTransaction) => Promise<T>) => Promise<T>;
  };
  acceptInvitationService: (
    data: AcceptInvitationInput,
    tx: PrismaTransaction,
  ) => Promise<{ invite: Invite }>;
  createUserService: (data: CreateUserInput, tx: PrismaTransaction) => Promise<User>;
  createMembershipService: (
    data: CreateMembershipInput,
    tx: PrismaTransaction
  ) => Promise<Membership>;
  findOrganizationById: (id: string, tx: PrismaTransaction) => Promise<Organization | null>;
  authProvider: {
    createUser: (args: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      orgId: string;
      orgRole: string;
      customMetadata?: Record<string, string>;
    }) => Promise<{ id: string; email: string; firstName: string; lastName: string }>;

    deleteUser: (id: string) => Promise<{ id: string }>;
  };
}

interface AcceptInvitationInput {
  invitationToken: string;
}

interface SignupInvitedUserInput {
  invitationToken: string;
  password: string;
}

export const signupInvitedUserUseCase = async (
  data: SignupInvitedUserInput,
  deps: SignupInvitedUserUseCaseDeps
): Promise<SignupOrgResult> => {
  const { invitationToken, password } = data;

  let externalUserId: string | undefined;
  const {
    transactionManager,
    authProvider,
    createUserService,
    createMembershipService,
    findOrganizationById,
  } = deps;

  try {
    return await transactionManager.runInTransaction(async (tx) => {
      const { invite } = await deps.acceptInvitationService({ invitationToken }, tx);

      const { email, firstName, lastName, role, organizationId } = invite;

      if (!firstName || !lastName) {
        throw new BadRequestError('Invitation is missing user details');
      }

      const externalUser = await authProvider.createUser({
        email,
        password,
        firstName,
        lastName,
        orgRole: role,
        orgId: organizationId,
      });

      externalUserId = externalUser.id;

      const user = await createUserService(
        {
          email,
          firstName,
          lastName,
          externalId: externalUser.id,
        },
        tx
      );

      const membership = await createMembershipService(
        {
          userId: user.id,
          organizationId,
          role,
          status: MembershipStatus.ACTIVE,
        },
        tx
      );

      const organization = await findOrganizationById(organizationId, tx);

      if (!organization) {
        throw new NotFoundError('Organization not found');
      }

      logger.info('Invitation accepted', { organizationId });

      return {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userId: user.id,
          role: membership.role,
        },
        tenant: {
          tenantId: organization.id,
          name: organization.name,
          slug: organization.slug,
          status: organization.status,
          subscriptionTier: organization.subscriptionTier,
          membershipId: membership.membershipId,
        },
      };
    });
  } catch (error) {
    if (externalUserId) {
      try {
        await authProvider.deleteUser(externalUserId);
      } catch (cleanupError) {
        logger.error('Error cleaning up external user', { externalUserId, error: cleanupError });
      }
    }
    throw error;
  }
};
