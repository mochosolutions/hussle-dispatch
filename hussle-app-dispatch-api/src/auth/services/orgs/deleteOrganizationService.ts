import { BadRequestError } from '@mocho/common';
import { logger } from '@/shared/utils/logger';
import type {
  Organization,
  DeleteOrganizationArgs,
  DeleteOrganizationServiceDeps,
} from '../../types/organizationTypes';

export const deleteOrganizationService = async (
  { organizationId }: DeleteOrganizationArgs,
  {
    deleteOrganization,
    findOrganizationById,
    revokeCarrierInviteTokensForOrg,
  }: DeleteOrganizationServiceDeps,
): Promise<Organization | null> => {
  try {
    logger.info('Deleting organization', { organizationId });
    const existingOrg = await findOrganizationById(organizationId);
    logger.info('Organization lookup complete', { organizationId, found: !!existingOrg });
    if (!existingOrg) {
      throw new BadRequestError('Organization not found');
    }
    const organization = await deleteOrganization(organizationId);
    await revokeCarrierInviteTokensForOrg(organizationId);
    return organization;
  } catch (error) {
    logger.error('Error deleting organization service', { organizationId, error });
    throw new BadRequestError('Error updating organization');
  }
};
