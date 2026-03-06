import { BadRequestError } from '@mocho/common';
import { logger } from '@/shared/utils/logger';
import type { Organization } from '../../types/organizationTypes';

export interface GetOrgByIdServiceDeps {
  findById: (id: string) => Promise<Organization | null>;
}

export const getAllOrgByIdService = async (
  data: { id: string },
  { findById }: GetOrgByIdServiceDeps,
) => {
  try {
    const { id } = data;
    const org = await findById(id);
    if (!org) {
      throw new BadRequestError(`Organization with id "${id}" not found`);
    }
    return org;
  } catch (error) {
    logger.error('Error fetching organization', { error });
    throw new BadRequestError('Failed to fetch organization');
  }
};
