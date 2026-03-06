import type { Request, RequestHandler, Response } from 'express';
import { getAllOrgService } from '../../services';
import type { Organization } from '../../types/organizationTypes';
import { toOrganizationListResponse } from './transformers/organizationTransformer';

interface OrganizationRepoDeps {
  findAllOrganizations: () => Promise<Organization[]>;
}

interface GetOrganizationsControllerDeps {
  orgRepo: OrganizationRepoDeps;
}

export const getOrganizationsController =
  ({ orgRepo }: GetOrganizationsControllerDeps): RequestHandler =>
  async (_req: Request, res: Response) => {
    const result = await getAllOrgService({
      findAll: orgRepo.findAllOrganizations,
    });
    const response = toOrganizationListResponse(result);

    return res.status(200).json({
      message: 'Organizations retrieved successfully',
      organizations: response.organizations,
    });
  };
