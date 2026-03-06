/**
 * Organization Repository (Prisma)
 * Handles all data access operations for Organizations using Prisma
 * Follows dependency injection pattern - receives Prisma client as parameter
 * Implements soft delete pattern
 */

import { BadRequestError } from '@mocho/common';
import type { PrismaClient, Organization as PrismaOrganization } from '@prisma/client';
import {
  OrganizationRole,
  OrganizationStatus,
  OrganizationVertical,
  SubscriptionTier,
} from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import type { PrismaTransaction } from '@/config/database';
// TODO: Refactor to use tenantRepositoryFactory or remove baseRepository dependency
import { repositoryFactoryPrisma } from '@/shared/utils/repositoryFactoryPrisma';
import type { CreateOrganizationInput, Organization } from '../types/organizationTypes';
import type { CreateUserInput, User } from '../types/user';
import type { CreateMembershipInput, Membership } from '../types/membershipTypes';
import { formatMembership } from './membershipRepositoryPrisma';
import { formatUser } from './userRepositoryPrisma';

const toOrgRole = (role: string): OrganizationRole =>
  Object.values(OrganizationRole).find((r) => r === role) ?? OrganizationRole.CARRIER;

const toOrgVertical = (vertical: string | undefined): OrganizationVertical | undefined => {
  if (vertical === undefined) {
    return undefined;
  }
  return Object.values(OrganizationVertical).find((v) => v === vertical);
};

const toOrgStatus = (status: string | undefined): OrganizationStatus | undefined => {
  if (status === undefined) {
    return undefined;
  }
  return Object.values(OrganizationStatus).find((s) => s === status);
};

const toSubscriptionTier = (tier: string | undefined): SubscriptionTier | undefined => {
  if (tier === undefined) {
    return undefined;
  }
  return Object.values(SubscriptionTier).find((t) => t === tier);
};

/**
 * Format Prisma Organization to API Organization (dates to strings)
 */
export const formatOrganization = (organization: PrismaOrganization): Organization => ({
  id: organization.id,
  name: organization.name,
  slug: organization.slug,
  email: organization.email,
  description: organization.description,
  logo: organization.logo,
  phoneNumber: organization.phoneNumber,
  address: organization.address,
  website: organization.website,
  vertical: organization.vertical,
  role: organization.role,
  subscriptionTier: organization.subscriptionTier,
  status: organization.status,
  customFields: organization.customFields,
  resources: organization.resources,
  deleted: organization.deleted,
  deletedAt: organization.deletedAt ? organization.deletedAt.toISOString() : '',
  createdAt: organization.createdAt.toISOString(),
  updatedAt: organization.updatedAt.toISOString(),
});

export const organizationRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
  _tenantId?: string,
) => {
  const baseRepository = repositoryFactoryPrisma<PrismaOrganization>({ prisma, modelName: 'organization' });

  const createOrganizationWithUserMembershipInternal = async (
    tx: PrismaClient | PrismaTransaction,
    payload: {
      organization: CreateOrganizationInput;
      user: CreateUserInput;
      membership: Omit<CreateMembershipInput, 'userId' | 'organizationId'>;
    },
  ): Promise<{ organization: Organization; user: User; membership: Membership }> => {
    const org = payload.organization;
    const createdOrganization = await tx.organization.create({
      data: {
        name: org.name,
        slug: org.slug,
        email: org.email,
        role: toOrgRole(org.role),
        ...(org.vertical !== undefined && { vertical: toOrgVertical(org.vertical) }),
        ...(org.status !== undefined && { status: toOrgStatus(org.status) }),
        ...(org.subscriptionTier !== undefined && {
          subscriptionTier: toSubscriptionTier(org.subscriptionTier),
        }),
        ...(org.description !== undefined && { description: org.description }),
        ...(org.logo !== undefined && { logo: org.logo }),
        ...(org.phoneNumber !== undefined && { phoneNumber: org.phoneNumber }),
        ...(org.address !== undefined && { address: org.address }),
        ...(org.website !== undefined && { website: org.website }),
      },
    });

    const createdUser = await tx.user.create({
      data: payload.user,
    });

    const createdMembership = await tx.membership.create({
      data: {
        ...payload.membership,
        userId: createdUser.id,
        organizationId: createdOrganization.id,
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

    return {
      organization: formatOrganization(createdOrganization),
      user: formatUser(createdUser),
      membership: formatMembership(createdMembership),
    };
  };

  return {
    createOrganization: async (
      data: CreateOrganizationInput,
    ): Promise<Organization> => {
      try {
        const rawOrg = await baseRepository.create({ data });
        return formatOrganization(rawOrg);
      } catch (error) {
        logger.error('Error creating organization', { error });
        throw new BadRequestError(`Error creating organization`);
      }
    },

    createOrganizationWithUserMembership: async (
      payload: {
        organization: CreateOrganizationInput;
        user: CreateUserInput;
        membership: Omit<CreateMembershipInput, 'userId' | 'organizationId'>;
      },
    ): Promise<{ organization: Organization; user: User; membership: Membership }> => {
      try {
        return createOrganizationWithUserMembershipInternal(prisma, payload);
      } catch (error) {
        logger.error('Error creating organization with user and membership', { error });
        throw new BadRequestError('Error creating organization with user and membership');
      }
    },

    findOrganizationByName: async (name: string): Promise<Organization | null> => {
      try {
        const org = await baseRepository.findOne({ filter: { name } });
        if (!org) {
          return null;
        }
        return formatOrganization(org);
      } catch (error) {
        logger.error('Error finding organization by name', { error });
        throw new BadRequestError('Error finding organization');
      }
    },

    updateOrganization: async (
      id: string,
      data: Partial<Organization>,
    ): Promise<Organization | null> => {
      try {
        // Convert string dates back to Date objects if present
        // Remove immutable date fields before update
        const { createdAt: _createdAt, updatedAt: _updatedAt, ...mutableData } = data;
        const dataForUpdate: Record<string, unknown> = {
          ...mutableData,
          ...(mutableData.deletedAt !== undefined && { deletedAt: new Date(mutableData.deletedAt) }),
        };

        const updated = await baseRepository.update({ id, data: dataForUpdate });
        if (!updated) {
          return null;
        }
        return formatOrganization(updated);
      } catch (error) {
        logger.error('Error updating organization', { error });
        throw new BadRequestError('Error updating organization');
      }
    },

    findOrganizationById: async (id: string): Promise<Organization | null> => {
      try {
        const org = await baseRepository.findOne({ filter: { id } });
        if (!org) {
          return null;
        }
        return formatOrganization(org);
      } catch (error) {
        logger.error('Error finding organization by ID', { error });
        throw new BadRequestError('Error finding organization');
      }
    },

    findAllOrganizations: async (): Promise<Organization[]> => {
      try {
        const organizations = await baseRepository.findMany();
        if (!organizations || organizations.length === 0) {
          logger.info('No organizations found');
          return [];
        }
        return organizations.map(formatOrganization);
      } catch (error) {
        logger.error('Error listing organizations', { error });
        throw new BadRequestError('Error listing organizations');
      }
    },

    /**
     * Soft delete organization
     * Sets deleted flag and deletedAt timestamp instead of removing record
     */
    deleteOrganization: async (id: string): Promise<Organization | null> => {
      try {
        logger.info('Deleting organization', { organizationId: id });
        // Soft delete: update deleted flag and timestamp
        const deletedOrg = await baseRepository.update({
          id,
          data: {
            deleted: true,
            deletedAt: new Date(),
          },
        });

        if (!deletedOrg) {
          return null;
        }

        return formatOrganization(deletedOrg);
      } catch (error) {
        logger.error('Error deleting organization', { error });
        throw new BadRequestError('Error deleting organization');
      }
    },

    findOneByFilter: async (
      filter: Partial<Organization>,
    ): Promise<Organization | null> => {
      try {
        logger.info('findOneByFilter', { filter });
        const org = await baseRepository.findOne({ filter });
        logger.info('findOneByFilter result', { found: !!org });
        if (!org) {
          return null;
        }
        return formatOrganization(org);
      } catch (error) {
        logger.error('Error finding organization by filter', { error });
        throw new BadRequestError('Error finding organization');
      }
    },
  };
};
