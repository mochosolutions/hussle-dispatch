import { logger } from '@/shared/utils/logger';
import type { Organization } from '../../types/organizationTypes';

export interface GetAllOrganizationsServiceDeps {
  findAll: (options?: { context?: any }) => Promise<Organization[]>;
}

export const getAllOrgService = async ({ findAll }: GetAllOrganizationsServiceDeps) => {
  try {
    const organizations = await findAll({});
    return organizations;
  } catch (error) {
    logger.error('Error fetching organizations', { error });
    throw new Error('Failed to fetch organizations');
  }
};
