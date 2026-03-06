import type { PrismaTransaction } from '@/shared/prisma';
import { ValidationError } from '@/shared/errors';
import { logger } from '@/shared/utils/logger';
import { generateSlug } from '../../../shared/utils/slugValidator';
import type { Membership } from '../../types/membershipTypes';
import type { CreateOrganizationInput, Organization } from '../../types/organizationTypes';
import type { SignupOrgInput, SignupOrgResult } from '../../types/signupOrgTypes';
import type { User, CreateUserInput } from '../../types/user';

export interface SignupOrganizationUseCaseDeps {
  transactionManager: {
    runInTransaction: <T>(fn: (tx: PrismaTransaction) => Promise<T>) => Promise<T>;
  };
  organizationRepository: {
    create: (
      input: {
        organization: CreateOrganizationInput;
        user: CreateUserInput;
        membership: {
          role: string;
          status: string;
        };
      },
      tx: PrismaTransaction,
    ) => Promise<{
      organization: Organization;
      user: User;
      membership: Membership;
    }>;
  };
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
    deleteUser: (id: string) => Promise<{ id: string }>;
  };
  config: {
    defaultOrgRole: string;
  };
}

const toCreateOrganizationInput = (input: {
  email: string;
  orgName: string;
  orgRole: string;
}): CreateOrganizationInput => ({
  name: input.orgName,
  slug: generateSlug(input.orgName),
  email: input.email,
  role: input.orgRole,
});

const toCreateUserInput = (input: {
  email: string;
  firstName: string;
  lastName: string;
  externalId: string;
}): CreateUserInput => ({
  email: input.email,
  firstName: input.firstName,
  lastName: input.lastName,
  externalId: input.externalId,
});

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const candidate = error.message;
    if (typeof candidate === 'string') {
      return candidate;
    }
  }

  return '';
};

const isExistingAccountError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('already exists');
};

export const signupOrganizationUseCase = async (
  data: SignupOrgInput,
  deps: SignupOrganizationUseCaseDeps,
): Promise<SignupOrgResult> => {
  const {
    email,
    password,
    firstName,
    lastName,
    orgName,
    orgRole = deps.config.defaultOrgRole,
    customMetadata = {},
  } = data;

  logger.debug('Signup metadata captured', {
    hasCustomMetadata: Object.keys(customMetadata).length > 0,
  });

  let externalUser: Awaited<
    ReturnType<SignupOrganizationUseCaseDeps['authProvider']['signUpUser']>
  >;

  try {
    externalUser = await deps.authProvider.signUpUser({
      email,
      password,
      firstName,
      lastName,
    });
  } catch (error: unknown) {
    if (isExistingAccountError(error)) {
      throw new ValidationError('An account with this email already exists. Please log in.');
    }

    throw error;
  }

  try {
    return await deps.transactionManager.runInTransaction(async (tx) => {
      logger.info('Starting organization signup process with Prisma transaction');

      const { organization, user, membership } = await deps.organizationRepository.create(
        {
          organization: toCreateOrganizationInput({ email, orgName, orgRole }),
          user: toCreateUserInput({
            email,
            firstName,
            lastName,
            externalId: externalUser.id,
          }),
          membership: {
            role: 'admin',
            status: 'active',
          },
        },
        tx,
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
  } catch (error: unknown) {
    logger.error('Error during organization signup process', { error });

    try {
      await deps.authProvider.deleteUser(externalUser.id);
    } catch (cleanupError: unknown) {
      logger.error('Error cleaning up external user', {
        externalUserId: externalUser.id,
        error: cleanupError,
      });
    }

    throw error;
  }
};
