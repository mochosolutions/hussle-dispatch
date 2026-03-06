import type { Request } from 'express';

export interface DeleteOrganizationInput {
  organizationId: string;
}

export const deleteOrganizationMapper = (req: Request): DeleteOrganizationInput => ({
  organizationId: req.params.organizationId ?? '',
});
