import type { Request, RequestHandler, Response } from 'express';
import { NotFoundError } from '@/shared/errors';
import { updateOrganizationService } from '../../services';
import type { Organization } from '../../types/organizationTypes';
import { updateOrganizationMapper } from './mappers/updateOrganizationMapper';
import { toOrganizationResponse } from './transformers/organizationTransformer';

interface OrganizationRepoDeps {
  findOrganizationById: (id: string) => Promise<Organization | null>;
  updateOrganization: (
    id: string,
    data: Partial<Organization>,
    context?: unknown,
  ) => Promise<Organization | null>;
}

interface UpdateOrganizationControllerDeps {
  orgRepo: OrganizationRepoDeps;
}

export const updateOrganizationController =
  ({ orgRepo }: UpdateOrganizationControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const { organizationId, data } = updateOrganizationMapper(req);
    const result = await updateOrganizationService(
      { id: organizationId, ...data },
      {
        findOrganizationById: orgRepo.findOrganizationById,
        updateOrganization: orgRepo.updateOrganization,
      },
    );

    if (!result) {
      throw new NotFoundError('Organization not found');
    }

    const response = toOrganizationResponse(result);

    return res.status(200).json({
      message: 'Organization updated successfully',
      organization: response.organization,
    });
  };
