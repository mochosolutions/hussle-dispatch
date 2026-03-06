import type { Request, RequestHandler, Response } from 'express';
import { NotFoundError } from '@/shared/errors';
import { deleteOrganizationService } from '../../services';
import type { Organization } from '../../types/organizationTypes';
import { deleteOrganizationMapper } from './mappers/deleteOrganizationMapper';

interface OrganizationRepoDeps {
  findOrganizationById: (id: string) => Promise<Organization | null>;
  deleteOrganization: (id: string, context?: unknown) => Promise<Organization | null>;
}

interface DeleteOrganizationControllerDeps {
  orgRepo: OrganizationRepoDeps;
}

export const deleteOrganizationController =
  ({ orgRepo }: DeleteOrganizationControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const { organizationId } = deleteOrganizationMapper(req);

    const result = await deleteOrganizationService(
      { organizationId },
      {
        deleteOrganization: orgRepo.deleteOrganization,
        findOrganizationById: orgRepo.findOrganizationById,
      },
    );

    if (!result) {
      throw new NotFoundError('Organization not found');
    }

    return res.status(200).json({ deleted: true });
  };
