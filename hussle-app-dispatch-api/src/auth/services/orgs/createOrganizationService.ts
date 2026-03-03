import { BadRequestError } from '@mocho/common';
import { logger } from '@/shared/utils/logger';
import type {
  CreateOrganizationInput,
  Organization,
  CreateOrganizationServiceDeps,
} from '../../types/organizationTypes';

export const createOrganizationService = async (
  data: CreateOrganizationInput,
  { create, findByName }: CreateOrganizationServiceDeps,
  context?: any
): Promise<Organization> => {
  try {
    logger.info('Creating organization', { name: data.name });
    const exists = await findByName(data.name, context);
    if (exists) {
      throw new BadRequestError(`Organization "${data.name}" already exists`);
    }
    return create({ ...data }, context);
  } catch (error) {
    logger.error('Error creating organization', { error });
    throw new BadRequestError(`Failed to create organization`);
  }
};
