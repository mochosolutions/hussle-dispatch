/**
 * User Repository (Prisma)
 *
 * CROSS-TENANT DESIGN:
 * Users are INTENTIONALLY cross-tenant entities. A single user can belong to
 * multiple organizations via the memberships table. This is by design.
 *
 * WHY NO RLS ON USERS TABLE:
 * - Users exist independently of organizations
 * - A user's identity (email, name) doesn't belong to any single org
 * - User data is shared across all orgs the user belongs to
 * - Memberships table (which HAS RLS) controls which orgs a user can access
 *
 * SERVICE-LAYER ACCESS CONTROL REQUIREMENTS:
 * Before returning user data to a request, the calling service/controller MUST:
 *
 * 1. For "get current user" operations:
 *    - User ID comes from authenticated JWT (trusted source)
 *    - No additional check needed - user is requesting their own data
 *
 * 2. For "get user by ID" operations (e.g., admin viewing another user):
 *    - MUST verify the requesting user has admin membership in current org
 *    - MUST verify the target user has membership in current org
 *    - Never expose users from other organizations
 *
 * 3. For "list users" operations:
 *    - ALWAYS filter by organizationId via membership join
 *    - findAllUsers() accepts organizationId parameter for this purpose
 *
 * 4. For user creation:
 *    - User creation doesn't require org context (user exists first)
 *    - Membership creation (separate operation) ties user to org
 *
 * IMPORTANT: This repository does NOT enforce tenant isolation.
 * Tenant isolation for user access is the responsibility of:
 * - Controllers: Extract organizationId from authenticated context
 * - Services: Verify membership before returning user data
 * - JWT Middleware: Ensures organizationId is from valid membership
 */

import { BadRequestError } from '@mocho/common';
import type { PrismaClient, User as PrismaUser } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import type { PrismaTransaction } from '@/config/database';
// TODO: Refactor to use tenantRepositoryFactory or remove baseRepository dependency
import { repositoryFactoryPrisma } from '@/shared/utils/repositoryFactoryPrisma';
import { MembershipStatus } from '../constants/enums';
import type { CreateUserInput, User, UserFilter, UserWithMemberships } from '../types/user';
import { formatMembership } from './membershipRepositoryPrisma';

/**
 * Format Prisma User to API User (dates to strings)
 */
export const formatUser = (user: PrismaUser): User => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  externalId: user.externalId,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

export const userRepositoryPrisma = (prisma: PrismaClient | PrismaTransaction) => {
  const baseRepository = repositoryFactoryPrisma<PrismaUser>({ prisma, modelName: 'user' });

  return {
    createUser: async (data: CreateUserInput, ): Promise<User> => {
      try {
        const rawUser = await baseRepository.create({ data });
        if (!rawUser) {
          throw new BadRequestError('User creation failed');
        }

        return {
          ...formatUser(rawUser),
          email: rawUser.email.toLowerCase(),
        };
      } catch (error) {
        logger.error('Error creating user', { error });
        throw new BadRequestError('Error creating user');
      }
    },

    findUserByFilter: async (filter: Partial<User>, ): Promise<User | null> => {
      try {
        logger.info('findUserByFilter', { filter });
        const docs = await baseRepository.findMany({ filter });

        if (!docs || docs.length === 0) {
          return null;
        }
        const firstDoc = docs[0];
        if (!firstDoc) {
          return null;
        }
        // Return first match
        return formatUser(firstDoc);
      } catch (error) {
        logger.error('Error finding user by filter', { error });
        throw new BadRequestError('Error finding user');
      }
    },

    findOneByFilter: async (filter: Partial<User>, ): Promise<User | null> => {
      try {
        logger.info('findOneByFilter', { filter });
        const rawUser = await baseRepository.findOne({ filter });
        logger.info('findOneByFilter result', { found: !!rawUser });
        if (!rawUser) {
          return null;
        }
        return formatUser(rawUser);
      } catch (error) {
        logger.error('Error finding user by filter', { error });
        throw new BadRequestError('Error finding user');
      }
    },

    /**
     * Finds a user by ID.
     *
     * ACCESS CONTROL: This returns ANY user regardless of organization.
     * Callers MUST verify the user has membership in the requesting organization
     * before exposing this data to end users.
     *
     * Safe uses:
     * - Getting current user (ID from JWT)
     * - Admin viewing user (after membership verification)
     *
     * Unsafe uses:
     * - Returning data without membership check
     */
    findUserById: async (id: string, ): Promise<User | null> => {
      try {
        const user = await baseRepository.findOne({ filter: { id } });
        if (!user) {
          return null;
        }

        return formatUser(user);
      } catch (error) {
        logger.error('Error finding user by ID', { error });
        throw new BadRequestError('Error finding user');
      }
    },

    /**
     * Finds a user with their memberships and organization data.
     *
     * ACCESS CONTROL: Returns ALL memberships for the user.
     * This is correct for "current user" context (user sees their own orgs).
     *
     * Safe for:
     * - User viewing their own profile/memberships
     * - Org selection after login
     *
     * Not safe for:
     * - Admin viewing another user (exposes their other orgs)
     */
    findUserByIdWithMemberships: async (id: string): Promise<UserWithMemberships | null> => {
      try {
        // Single query to fetch user with memberships and organization data
        const user = await prisma.user.findUnique({
          where: { id },
          include: {
            memberships: {
              where: { deleted: false, status: MembershipStatus.ACTIVE },
              include: {
                organization: {
                  select: {
                    id: true,
                    name: true,
                    subscriptionTier: true,
                    status: true,
                  },
                },
              },
            },
          },
        });

        if (!user) {
          return null;
        }

        return {
          ...formatUser(user),
          memberships: user.memberships.map((m) => formatMembership(m)),
        };
      } catch (error) {
        logger.error('Error finding user by ID with memberships', { error });
        throw new BadRequestError('Error finding user with memberships');
      }
    },

    /**
     * Finds a user by email address.
     *
     * ACCESS CONTROL: This returns ANY user regardless of organization.
     * Use only for:
     * - Login flows (before org context exists)
     * - Invitation acceptance (verifying email)
     * - Password reset (user-initiated, no org context)
     *
     * Never use to expose user data in org-scoped admin views.
     */
    findUserByEmail: async (email: string, ): Promise<User | null> => {
      try {
        const user = await baseRepository.findOne({ filter: { email } });
        if (!user) {
          return null;
        }
        return formatUser(user);
      } catch (error) {
        logger.error('Error finding user by email', { error });
        throw new BadRequestError('Error finding user');
      }
    },

    findUserByExternalId: async (externalId: string, ): Promise<User | null> => {
      try {
        const user = await baseRepository.findOne({ filter: { externalId } });
        if (!user) {
          return null;
        }
        return formatUser(user);
      } catch (error) {
        logger.error('Error finding user by external ID', { error });
        throw new BadRequestError('Error finding user');
      }
    },

    /**
     * Lists users with optional organization filtering.
     *
     * ACCESS CONTROL: When used for org-scoped admin views,
     * ALWAYS pass organizationId to filter by membership.
     *
     * The organizationId filter uses membership join:
     * WHERE memberships.organizationId = :orgId
     *
     * Without organizationId, returns ALL users (system admin only).
     */
    findAllUsers: async (options?: {
      page?: number;
      limit?: number;
      organizationId?: string;
    }): Promise<{ users: User[]; total: number; page: number; limit: number }> => {
      try {
        const page = options?.page || 1;
        const limit = options?.limit || 50;
        const skip = (page - 1) * limit;

        const where = options?.organizationId
          ? { memberships: { some: { organizationId: options.organizationId } } }
          : {};

        const [users, total] = await Promise.all([
          prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.user.count({ where }),
        ]);

        return {
          users: users.map(formatUser),
          total,
          page,
          limit,
        };
      } catch (error) {
        logger.error('Error finding all users', { error });
        throw new BadRequestError('Error finding all users');
      }
    },

    updateUser: async (id: string, data: Partial<User>, ): Promise<User | null> => {
      try {
        const updated = await baseRepository.update({ id, data });
        if (!updated) {
          return null;
        }
        return formatUser(updated);
      } catch (error) {
        logger.error('Error updating user', { error });
        throw new BadRequestError('Error updating user');
      }
    },

    updateManyUsers: async (
      filter: UserFilter,
      data: Partial<User>,
    ): Promise<User[] | null> => {
      try {
        // Prisma updateMany returns count, not records
        // Need to fetch updated records separately
        const count = await baseRepository.updateMany({ filter: { ...filter }, data });
        logger.info('updateManyUsers count', { count });

        if (count === 0) {
          return null;
        }

        // Fetch the updated users
        const updatedUsers = await baseRepository.findMany({ filter: { ...filter } });
        return updatedUsers.map(formatUser);
      } catch (error) {
        logger.error('Error updating users', { error });
        throw new BadRequestError('Error updating users');
      }
    },

    deleteUser: async (id: string, ): Promise<User | null> => {
      try {
        const deletedUser = await baseRepository.delete({ id });
        if (!deletedUser) {
          return null;
        }

        return formatUser(deletedUser);
      } catch (error) {
        logger.error('Error deleting user', { error });
        throw new BadRequestError('Error deleting user');
      }
    },

    findUsersByEmails: async (emails: string[]): Promise<{ id: string }[]> => {
      try {
        const users = await prisma.user.findMany({
          where: { email: { in: emails } },
          select: { id: true },
        });
        return users;
      } catch (error) {
        logger.error('Error finding users by emails', { error });
        throw new BadRequestError('Error finding users by emails');
      }
    },
  };
};
