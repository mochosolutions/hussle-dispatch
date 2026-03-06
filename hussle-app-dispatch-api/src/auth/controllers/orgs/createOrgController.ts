import type { Request, RequestHandler, Response } from 'express';
import { createOrganizationService } from '../../services';
import type { CreateOrganizationInput, Organization } from '../../types/organizationTypes';
import { createOrganizationMapper } from './mappers/createOrganizationMapper';
import { toOrganizationResponse } from './transformers/organizationTransformer';

interface OrganizationRepoDeps {
  createOrganization: (data: CreateOrganizationInput) => Promise<Organization>;
}

interface CreateOrganizationControllerDeps {
  orgRepo: OrganizationRepoDeps;
}

export const createOrganizationController =
  ({ orgRepo }: CreateOrganizationControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const requestPayload = createOrganizationMapper(req);
    const result = await createOrganizationService(
      requestPayload,
      {
        create: orgRepo.createOrganization,
      },
    );
    const response = toOrganizationResponse(result);

    return res.status(201).json({
      message: 'Organization created successfully',
      data: response.organization,
    });
  };
