/**
 * Membership Repository (Prisma)
 * Handles all data access operations for Memberships using Prisma
 * Follows dependency injection pattern - receives Prisma client as parameter
 * Implements soft delete pattern
 *
 * METHOD CLASSIFICATION:
 *
 * TENANT-SCOPED: Methods that MUST filter by organizationId.
 * - All writes (create, update, delete) within a tenant
 * - Reads that should only return data from current tenant
 *
 * CROSS-TENANT: Methods that intentionally span multiple tenants.
 * - User's own memberships (a user belongs to multiple orgs)
 * - Must have documented justification
 * - Requires service-layer access control
 *
 * GLOBAL: Methods for system operations (admin, migrations).
 * - Requires explicit bypass
 * - Should only be called with globalRepositoryFactory
 */

import { BadRequestError } from '@mocho/common';
import type { PrismaClient, Membership as PrismaMembership } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import type { PrismaTransaction } from '@/config/database';
// TODO: Refactor to use tenantRepositoryFactory or remove baseRepository dependency
import { repositoryFactoryPrisma } from '@/shared/utils/repositoryFactoryPrisma';
import type {
  CreateMembershipInput,
  Membership,
  MembershipFilter,
  MembershipWithUser,
} from '../types/membershipTypes';

interface PrismaMembershipWithOrg {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  organization?: {
    id?: string;
    name?: string;
    slug?: string;
    subscriptionTier?: string;
    status?: string;
  } | null;
}

interface PrismaMembershipWithUser {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    externalId?: string;
  } | null;
}

/**
 * Format Prisma Membership to API Membership (dates to strings, populate organization data)
 */
export const formatMembership = (membership: PrismaMembershipWithOrg): Membership => {
  try {
    const { id, userId, organizationId, organization, role, status, createdAt, updatedAt } =
      membership;

    const orgName = organization?.name || 'Unknown Organization';
    const orgSlug = organization?.slug || '';
    const orgSubscriptionTier = organization?.subscriptionTier || 'free';
    const orgStatus = organization?.status || 'inactive';

    return {
      role,
      status,
      membershipId: id,
      userId,
      orgName,
      orgSlug,
      orgSubscriptionTier,
      orgStatus,
      organizationId: organization?.id || organizationId,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  } catch (error) {
    logger.error('Error formatting membership', { error });
    throw new BadRequestError('Error formatting membership');
  }
};

/**
 * Format Membership with populated User data
 */
export const formatMembershipUsers = (membership: PrismaMembershipWithUser): MembershipWithUser => {
  const { id, userId, user, organizationId, role, status, createdAt, updatedAt } = membership;

  return {
    id,
    userId: user?.id || userId,
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    organizationId,
    externalId: user?.externalId || '',
    role,
    status,
    createdAt: createdAt?.toISOString(),
    updatedAt: updatedAt?.toISOString(),
  };
};

export const membershipRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
  tenantId?: string
) => {
  const baseRepository = repositoryFactoryPrisma<PrismaMembership>({ prisma, modelName: 'membership', tenantId });

  return {
    /**
     * TENANT-SCOPED: Creates a membership in the current tenant.
     * Always uses tenantId to set organizationId.
     */
    create: async (data: CreateMembershipInput): Promise<Membership> => {
      try {
        // Create membership with organization data in single query
        const created = await prisma.membership.create({
          data: tenantId ? { ...data, organizationId: tenantId } : data,
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                subscriptionTier: true,
                status: true,
              },
            },
          },
        });

        if (!created) {
          logger.error('Membership creation failed');
          throw new BadRequestError('Membership creation failed');
        }

        return formatMembership(created);
      } catch (error) {
        logger.error('Error creating membership', { error });
        throw new BadRequestError('Error creating membership');
      }
    },

    /**
     * TENANT-SCOPED: Finds a single membership within current tenant.
     * Filters by organizationId when tenantId is provided.
     */
    findOneByFilter: async (
      filter: Record<string, unknown>,
          ): Promise<Membership | null> => {
      try {
        const where = tenantId ? { ...filter, organizationId: tenantId } : filter;

        // Single query with organization data included
        const membership = await prisma.membership.findFirst({
          where,
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                subscriptionTier: true,
                status: true,
              },
            },
          },
        });

        return membership ? formatMembership(membership) : null;
      } catch (error) {
        logger.error('Error finding membership by filter', { error });
        throw new BadRequestError('Error finding membership');
      }
    },

    /**
     * TENANT-SCOPED: Finds memberships matching filter within current tenant.
     * Should filter by organizationId when tenantId is provided.
     */
    findMembershipsByFilter: async (
      filter: Record<string, unknown>,
          ): Promise<MembershipWithUser[] | null> => {
      try {
        // Apply tenant filter - FIX: add tenantId to filter
        const where = tenantId ? { ...filter, organizationId: tenantId } : filter;

        const memberships = await prisma.membership.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                externalId: true,
              },
            },
          },
        });

        logger.info('findMembershipsByFilter', { count: memberships.length });

        if (!memberships || memberships.length === 0) {
          return null;
        }

        return memberships.map(formatMembershipUsers);
      } catch (error) {
        logger.error('Error finding memberships by filter', { error });
        throw new BadRequestError('Error finding memberships');
      }
    },

    /**
     * CROSS-TENANT: Returns all memberships for a user across ALL organizations.
     *
     * JUSTIFICATION: Users belong to multiple organizations. When a user logs in
     * or switches orgs, they need to see all their memberships to select which
     * org to access.
     *
     * SERVICE-LAYER CONTROL: The calling code (getCurrentUserController, switchOrgController)
     * MUST verify the userId matches the authenticated user's ID. A user should only
     * see their own memberships, not other users' memberships.
     */
    findMembershipsByUserId: async (
      userId: string,
          ): Promise<Membership[] | null> => {
      try {
        const memberships = await prisma.membership.findMany({
          where: { userId },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                subscriptionTier: true,
                status: true,
              },
            },
          },
        });

        if (!memberships || memberships.length === 0) {
          return null;
        }

        return memberships.map(formatMembership);
      } catch (error) {
        logger.error('Error finding memberships by user ID', { error });
        throw new BadRequestError('Error finding memberships');
      }
    },

    /**
     * GLOBAL: Returns ALL memberships across all organizations.
     *
     * WARNING: Only use for admin tools or system operations.
     * This method should ONLY be called with globalRepositoryFactory (RLS bypass).
     *
     * For user-facing requests, use findMembershipByOrg (filtered by tenant).
     */
    findAllMemberships: async (): Promise<Membership[]> => {
      try {
        const memberships = await prisma.membership.findMany({
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                subscriptionTier: true,
                status: true,
              },
            },
          },
        });

        if (!memberships || memberships.length === 0) {
          logger.info('No memberships found');
          return [];
        }

        return memberships.map(formatMembership);
      } catch (error) {
        logger.error('Error listing memberships', { error });
        throw new BadRequestError('Error listing memberships');
      }
    },

    /**
     * TENANT-SCOPED: Updates a membership within current tenant.
     * Should verify membership belongs to organizationId.
     */
    updateMembership: async (
      id: string,
      data: Partial<Membership>,
          ): Promise<Membership | null> => {
      try {
        // Apply tenant filter - FIX: add tenantId to where clause
        const where = tenantId ? { id, organizationId: tenantId } : { id };

        // Update with organization data in single query
        const updated = await prisma.membership.update({
          where,
          data,
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                subscriptionTier: true,
                status: true,
              },
            },
          },
        });

        return formatMembership(updated);
      } catch (error) {
        logger.error('Error updating membership', { error });
        throw new BadRequestError('Error updating membership');
      }
    },

    /**
     * TENANT-SCOPED: Bulk updates memberships within current tenant.
     * Uses baseRepository which applies tenantId filter.
     */
    updateManyMembership: async (
      filter: MembershipFilter,
      data: Partial<Membership>,
          ): Promise<Membership[] | null> => {
      try {
        const updateCount = await baseRepository.updateMany({ filter: { ...filter }, data });
        logger.info('updateManyMembership count', { updateCount });

        if (updateCount === 0) {
          return null;
        }

        // Fetch updated memberships with organization populated
        const updatedMemberships = await prisma.membership.findMany({
          where: filter,
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                subscriptionTier: true,
                status: true,
              },
            },
          },
        });

        return updatedMemberships.map(formatMembership);
      } catch (error) {
        logger.error('Error updating memberships', { error });
        throw new BadRequestError('Error updating memberships');
      }
    },

    /**
     * TENANT-SCOPED: Soft deletes a membership within current tenant.
     * Should verify membership belongs to organizationId before deleting.
     */
    deleteMembership: async (id: string): Promise<Membership | null> => {
      try {
        // Apply tenant filter - FIX: verify membership belongs to tenant before deleting
        const where = tenantId ? { id, organizationId: tenantId } : { id };

        // Soft delete with update and include organization in single query
        const deletedMembership = await prisma.membership.update({
          where,
          data: {
            deleted: true,
            deletedAt: new Date(),
            status: 'deleted',
          },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                subscriptionTier: true,
                status: true,
              },
            },
          },
        });

        return formatMembership(deletedMembership);
      } catch (error) {
        logger.error('Error deleting membership', { error });
        throw new BadRequestError('Error deleting membership');
      }
    },

    /**
     * TENANT-SCOPED: Bulk soft deletes memberships within current tenant.
     * Uses baseRepository which applies tenantId filter.
     */
    deleteManyMemberships: async (ids: string[], _context?: unknown): Promise<number> => {
      try {
        // Soft delete: update deleted flag and status
        const updateData = {
          deleted: true,
          deletedAt: new Date(),
          status: 'deleted',
        };
        const filter = { id: { in: ids } };

        const updateCount = await baseRepository.updateMany({ filter, data: updateData });
        logger.info('deleteManyMemberships count', { updateCount });

        return updateCount;
      } catch (error) {
        logger.error('Error deleting memberships by filter', { error });
        throw new BadRequestError('Error deleting memberships');
      }
    },

    /**
     * TENANT-SCOPED: Lists all members in the current organization.
     * Filters by organizationId when tenantId is provided.
     */
    findMembershipByOrg: async (): Promise<MembershipWithUser[] | null> => {
      try {
        // This uses tenant filtering from baseRepository context
        const memberships = await prisma.membership.findMany({
          where: tenantId ? { organizationId: tenantId } : {},
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                externalId: true,
              },
            },
          },
        });

        return memberships.map(formatMembershipUsers);
      } catch (error) {
        logger.error('Error finding memberships by organization', { error });
        throw new BadRequestError('Error finding memberships by organization');
      }
    },

    /**
     * CROSS-TENANT: Counts active memberships for a user across ALL organizations.
     *
     * JUSTIFICATION: Used to check if a user has any remaining active memberships
     * when deleting an organization or membership. This count spans all orgs.
     *
     * SERVICE-LAYER CONTROL: Only use for checking the authenticated user's own
     * membership count or in admin contexts with proper authorization.
     */
    getActiveMembershipsCount: async (userId: string): Promise<number> => {
      try {
        // Count active memberships for a user (excluding soft-deleted ones)
        const count = await prisma.membership.count({
          where: {
            userId,
            deleted: false,
            status: { not: 'deleted' },
          },
        });
        return count;
      } catch (error) {
        logger.error('Error counting active memberships for user', { error });
        throw new BadRequestError('Error counting active memberships for user');
      }
    },
  };
};

export type MembershipRepositoryPrisma = ReturnType<typeof membershipRepositoryPrisma>;
export type MembershipRepo = MembershipRepositoryPrisma;
