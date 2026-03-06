import type { Request, RequestHandler, Response } from 'express';
import { NotFoundError } from '@/shared/errors';
import type { Organization } from '../../types/organizationTypes';
import { getOrganizationByIdMapper } from './mappers/getOrganizationByIdMapper';
import { toOrganizationResponse } from './transformers/organizationTransformer';

interface OrganizationRepoDeps {
  findOrganizationById: (id: string) => Promise<Organization | null>;
}

interface GetOrganizationByIdControllerDeps {
  orgRepo: OrganizationRepoDeps;
}

export const getOrganizationsByIdController =
  ({ orgRepo }: GetOrganizationByIdControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const { organizationId } = getOrganizationByIdMapper(req);
    const result = await orgRepo.findOrganizationById(organizationId);

    if (!result) {
      throw new NotFoundError('Organization not found');
    }

    const response = toOrganizationResponse(result);

    return res.status(200).json({
      message: 'Organizations retrieved successfully',
      organization: response.organization,
    });
  };
