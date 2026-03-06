import { BadRequestError } from '@mocho/common';
import { logger } from '@/shared/utils/logger';
import type { Organization } from '../../types/organizationTypes';

interface UpdateOrganizationServiceDeps {
  updateOrganization: (id: string, data: Partial<Organization>) => Promise<Organization | null>;
  findOrganizationById: (id: string) => Promise<Organization | null>;
}

interface UpdateOrganizationData extends Partial<Organization> {
  id: string;
}

export const updateOrganizationService = async (
  { id: organizationId, ...data }: UpdateOrganizationData,
  { updateOrganization, findOrganizationById }: UpdateOrganizationServiceDeps,
): Promise<Organization | null> => {
  try {
    logger.info('Updating organization', { organizationId });
    const existing = await findOrganizationById(organizationId);
    if (!existing) {
      throw new BadRequestError('Organization not found');
    }
    const updated = await updateOrganization(organizationId, data);
    return updated;
  } catch (error) {
    logger.error('Error in updateOrganizationService', { organizationId, error });
    throw new BadRequestError('Error updating organization');
  }
};
