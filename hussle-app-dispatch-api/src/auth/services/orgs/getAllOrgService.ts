import { logger } from '@/shared/utils/logger';
import { SequenceError } from '@/shared/errors';
import type { Organization } from '../../types/organizationTypes';

export interface GetAllOrganizationsServiceDeps {
  findAll: () => Promise<Organization[]>;
}

export const getAllOrgService = async ({ findAll }: GetAllOrganizationsServiceDeps) => {
  try {
    const organizations = await findAll();
    return organizations;
  } catch (error) {
    logger.error('Error fetching organizations', { error });
    const serviceError = new SequenceError('Failed to fetch organizations');
    serviceError.cause = error;
    throw serviceError;
  }
};
