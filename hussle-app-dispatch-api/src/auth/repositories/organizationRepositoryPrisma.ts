/**
 * Organization Repository (Prisma)
 * Handles all data access operations for Organizations using Prisma
 * Follows dependency injection pattern - receives Prisma client as parameter
 * Implements soft delete pattern
 */

/* eslint-disable max-lines-per-function, max-lines, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, no-console, @typescript-eslint/no-unnecessary-condition */
// TODO: Fix pre-existing lint violations - this file has 100+ lint errors from legacy code

import { BadRequestError } from '@mocho/common';
import type { PrismaClient, Organization as PrismaOrganization } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import type { PrismaTransaction } from '@/config/database';
// TODO: Refactor to use tenantRepositoryFactory or remove baseRepository dependency
// eslint-disable-next-line no-restricted-imports
import { repositoryFactoryPrisma } from '@/shared/utils/repositoryFactoryPrisma';
import type { CreateOrganizationInput, Organization } from '../types/organizationTypes';

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
  tenantId?: string
) => {
  const baseRepository = repositoryFactoryPrisma<PrismaOrganization>(prisma, 'organization');

  return {
    createOrganization: async (
      data: CreateOrganizationInput,
      context?: any
    ): Promise<Organization> => {
      try {
        const rawOrg = await baseRepository.create({ data });
        return formatOrganization(rawOrg);
      } catch (error) {
        logger.error('Error creating organization', { error });
        throw new BadRequestError(`Error creating organization`);
      }
    },

    findOrganizationByName: async (name: string, context?: any): Promise<Organization | null> => {
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
      context?: any
    ): Promise<Organization | null> => {
      try {
        // Convert string dates back to Date objects if present
        const dataForUpdate: any = {
          ...data,
        };

        // Handle deletedAt conversion
        if (data.deletedAt) {
          dataForUpdate.deletedAt = new Date(data.deletedAt);
        }

        // Remove fields that shouldn't be updated directly
        delete dataForUpdate.createdAt;
        delete dataForUpdate.updatedAt;

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
    deleteOrganization: async (id: string, context?: any): Promise<Organization | null> => {
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
      context?: any
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
