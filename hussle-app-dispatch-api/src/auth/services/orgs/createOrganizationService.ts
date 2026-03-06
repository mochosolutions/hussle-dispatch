import { BadRequestError } from '@mocho/common';
import { logger } from '@/shared/utils/logger';
import type {
  CreateOrganizationInput,
  Organization,
  CreateOrganizationServiceDeps,
} from '../../types/organizationTypes';

export const createOrganizationService = async (
  data: CreateOrganizationInput,
  { create }: CreateOrganizationServiceDeps,
): Promise<Organization> => {
  try {
    logger.info('Creating organization', { name: data.name });
    return await create({ ...data });
  } catch (error) {
    logger.error('Error creating organization', { error });
    throw new BadRequestError(`Failed to create organization`);
  }
};
