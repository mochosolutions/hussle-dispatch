import type { PrismaTransaction } from '@/shared/prisma';
import { logger } from '@/shared/utils/logger';
import { generateSlug } from '../../../shared/utils/slugValidator';
import type { CreateMembershipInput, Membership } from '../../types/membershipTypes';
import type { CreateOrganizationInput, Organization } from '../../types/organizationTypes';
import type { SignupOrgInput, SignupOrgResult } from '../../types/signupOrgTypes';
import type { User, CreateUserInput } from '../../types/user';

export interface SignupOrganizationUseCaseDeps {
  transactionManager: {
    runInTransaction: <T>(fn: (tx: PrismaTransaction) => Promise<T>) => Promise<T>;
  };
  createOrgService: (data: CreateOrganizationInput, tx: PrismaTransaction) => Promise<Organization>;
  createUserService: (data: CreateUserInput, tx: PrismaTransaction) => Promise<User>;
  createMembershipService: (
    data: CreateMembershipInput,
    tx: PrismaTransaction
  ) => Promise<Membership>;
  authProvider: {
    signUpUser: (args: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => Promise<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      codeDeliveryDetails?: {
        destination?: string;
        deliveryMedium?: string;
        attributeName?: string;
      };
    }>;
    deleteUser: (id: string) => Promise<any>;
  };
}

export const signupOrganizationUseCase = async (
  data: SignupOrgInput,
  deps: SignupOrganizationUseCaseDeps
): Promise<SignupOrgResult> => {
  const {
    email,
    password,
    firstName,
    lastName,
    orgName,
    orgRole = 'BROKER', // Default value if not provided
    orgVertical = 'STAFFING', // Default value if not provided
    customMetadata = {},
  } = data;

  let externalUserId: string | undefined;

  try {
    return await deps.transactionManager.runInTransaction(async (tx) => {
      logger.info('Starting organization signup process with Prisma transaction');

      // Generate slug from org name (e.g., "Acme Corp" -> "acme-corp")
      const orgSlug = generateSlug(orgName);

      const organization = await deps.createOrgService(
        {
          name: orgName,
          slug: orgSlug,
          email,
          role: orgRole,
          vertical: orgVertical,
        },
        tx
      );

      // Use SignUp API for public self-service registration (NOT AdminCreateUser)
      // User will be UNCONFIRMED and must verify email with code before login
      const externalUser = await deps.authProvider.signUpUser({
        email,
        password,
        firstName,
        lastName,
      });

      externalUserId = externalUser.id;

      const user = await deps.createUserService(
        {
          email,
          firstName,
          lastName,
          externalId: externalUser.id,
        },
        tx
      );

      const membership = await deps.createMembershipService(
        {
          userId: user.id,
          organizationId: organization.id,
          role: 'admin',
          status: 'active',
        },
        tx
      );

      logger.info('Organization signup process completed successfully', {
        userId: user.id,
        organizationId: organization.id,
        membershipId: membership.membershipId,
      });

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
    logger.error('Error during organization signup process', { error });
    if (externalUserId) {
      try {
        await deps.authProvider.deleteUser(externalUserId);
      } catch (cleanupError) {
        logger.error('Error cleaning up external user', { externalUserId, error: cleanupError });
      }
    }
    throw error;
  }
};
