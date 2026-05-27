import type { PrismaTransaction } from '@/shared/prisma';
import { ValidationError } from '@/shared/errors';
import { ConflictError } from '@/shared/errors/commonErrors';
import { logger } from '@/shared/utils/logger';
import { generateSlug, resolveUniqueSlug } from '../../../shared/utils/slugValidator';
import type { CreateMembershipInput, Membership } from '../../types/membershipTypes';
import type { CreateOrganizationInput, Organization } from '../../types/organizationTypes';
import type { SignupOrgInput, SignupOrgResult } from '../../types/signupOrgTypes';
import type { User, CreateUserInput } from '../../types/user';
import { MembershipStatus, OrganizationStatus } from '../../constants/enums';
import { ROLES } from '@/config/roles';

const MAX_SLUG_RETRIES = 3;

export interface SignupOrganizationUseCaseDeps {
  transactionManager: {
    runInTransaction: <T>(fn: (tx: PrismaTransaction) => Promise<T>) => Promise<T>;
  };
  organizationRepository: {
    create: (input: CreateOrganizationInput, tx: PrismaTransaction) => Promise<Organization>;
    findSlugsWithPrefix: (slugPrefix: string) => Promise<string[]>;
  };
  userRepository: {
    create: (input: CreateUserInput, tx: PrismaTransaction) => Promise<User>;
  };
  membershipRepository: {
    create: (input: CreateMembershipInput, tx: PrismaTransaction) => Promise<Membership>;
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
  slug: string;
}): CreateOrganizationInput => ({
  name: input.orgName,
  slug: input.slug,
  email: input.email,
  role: input.orgRole,
  status: OrganizationStatus.ACTIVE,
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

const hasCode = (value: unknown): value is { code: unknown } =>
  typeof value === 'object' && value !== null && 'code' in value;

const isPrismaUniqueConstraintError = (error: unknown): boolean =>
  hasCode(error) && error.code === 'P2002';

const resolveSlug = async (
  orgName: string,
  deps: Pick<SignupOrganizationUseCaseDeps, 'organizationRepository'>,
): Promise<string> => {
  const baseSlug = generateSlug(orgName);
  const existingSlugs = await deps.organizationRepository.findSlugsWithPrefix(baseSlug);
  const slug = resolveUniqueSlug(baseSlug, existingSlugs);

  if (slug === null) {
    throw new ConflictError(
      `Unable to generate a unique slug for organization "${orgName}". Too many similar names exist.`,
    );
  }

  return slug;
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
    let lastError: unknown;
    let attempt = 0;

    while (attempt < MAX_SLUG_RETRIES) {
      try {
        const slug = await resolveSlug(orgName, deps);

        const result = await deps.transactionManager.runInTransaction(async (tx) => {
          logger.info('Starting organization signup process with Prisma transaction', {
            attempt: attempt + 1,
            slug,
          });

          const organization = await deps.organizationRepository.create(
            toCreateOrganizationInput({ email, orgName, orgRole, slug }),
            tx,
          );

          const user = await deps.userRepository.create(
            toCreateUserInput({
              email,
              firstName,
              lastName,
              externalId: externalUser.id,
            }),
            tx,
          );

          const membership = await deps.membershipRepository.create(
            {
              userId: user.id,
              organizationId: organization.id,
              role: ROLES.ADMIN,
              status: MembershipStatus.ACTIVE,
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

        return result;
      } catch (error: unknown) {
        lastError = error;

        if (isPrismaUniqueConstraintError(error)) {
          logger.warn('Slug collision during signup, retrying', {
            attempt: attempt + 1,
            orgName,
          });
          attempt += 1;
          continue;
        }

        break;
      }
    }

    if (isPrismaUniqueConstraintError(lastError)) {
      throw new ConflictError(
        `Unable to create organization "${orgName}" due to a naming conflict. Please try a different name.`,
      );
    }

    throw lastError;
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
