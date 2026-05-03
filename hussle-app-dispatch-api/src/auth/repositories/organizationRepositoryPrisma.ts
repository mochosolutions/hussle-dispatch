/**
 * Organization Repository (Prisma)
 * Handles all data access operations for Organizations using Prisma
 * Follows dependency injection pattern - receives Prisma client as parameter
 * Implements soft delete pattern
 */

import { BadRequestError } from '@mocho/common';
import type {
  PrismaClient,
  Organization as PrismaOrganization,
  OrganizationRole,
  OrganizationVertical,
  SubscriptionTier,
} from '@prisma/client';
import { OrganizationStatus } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import type { PrismaTransaction } from '@/config/database';
// TODO: Refactor to use tenantRepositoryFactory or remove baseRepository dependency
import { repositoryFactoryPrisma } from '@/shared/utils/repositoryFactoryPrisma';
import type { CreateOrganizationInput, Organization } from '../types/organizationTypes';
import type { AuthEnumConfig } from '../types/authEnumConfig';

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
  headquartersLatitude: organization.headquartersLatitude,
  headquartersLongitude: organization.headquartersLongitude,
  deleted: organization.deleted,
  deletedAt: organization.deletedAt ? organization.deletedAt.toISOString() : '',
  createdAt: organization.createdAt.toISOString(),
  updatedAt: organization.updatedAt.toISOString(),
});

export const organizationRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
  _tenantId?: string,
  enumConfig?: AuthEnumConfig,
) => {
  const toOrgRole = (role: string): OrganizationRole => {
    const values = enumConfig?.organizationRole.values ?? [];
    const defaultRole = enumConfig?.organizationRole.default ?? role;
    return (values.find((r) => r === role) ?? defaultRole) as OrganizationRole;
  };

  const toOrgVertical = (vertical: string | undefined): OrganizationVertical | undefined => {
    if (vertical === undefined) {
      return undefined;
    }
    const values = enumConfig?.organizationVertical.values ?? [];
    return values.find((v) => v === vertical) as OrganizationVertical | undefined;
  };

  const toOrgStatus = (status: string | undefined): OrganizationStatus => {
    if (status === undefined) {
      return OrganizationStatus.ACTIVE;
    }
    return (
      Object.values(OrganizationStatus).find((s) => s === status) ?? OrganizationStatus.ACTIVE
    );
  };

  const toSubscriptionTier = (tier: string | undefined): SubscriptionTier | undefined => {
    if (tier === undefined) {
      return undefined;
    }
    const values = enumConfig?.subscriptionTier.values ?? [];
    return values.find((t) => t === tier) as SubscriptionTier | undefined;
  };

  const baseRepository = repositoryFactoryPrisma<PrismaOrganization>({
    prisma,
    modelName: 'organization',
  });

  return {
    createOrganization: async (data: CreateOrganizationInput): Promise<Organization> => {
      try {
        const rawOrg = await prisma.organization.create({
          data: {
            name: data.name,
            slug: data.slug,
            email: data.email,
            role: toOrgRole(data.role),
            ...(data.vertical !== undefined && { vertical: toOrgVertical(data.vertical) }),
            ...(data.status !== undefined && { status: toOrgStatus(data.status) }),
            ...(data.subscriptionTier !== undefined && {
              subscriptionTier: toSubscriptionTier(data.subscriptionTier),
            }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.logo !== undefined && { logo: data.logo }),
            ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.website !== undefined && { website: data.website }),
          },
        });
        return formatOrganization(rawOrg);
      } catch (error) {
        logger.error('Error creating organization', { error });
        throw new BadRequestError(`Error creating organization`);
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
          ...(mutableData.deletedAt !== undefined && {
            deletedAt: new Date(mutableData.deletedAt),
          }),
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

    findSlugsWithPrefix: async (slugPrefix: string): Promise<string[]> => {
      const orgs = await prisma.organization.findMany({
        where: { slug: { startsWith: slugPrefix } },
        select: { slug: true },
      });
      return orgs.map((o: { slug: string }) => o.slug);
    },

    findOneByFilter: async (filter: Partial<Organization>): Promise<Organization | null> => {
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
