import type { Request } from 'express';

export interface GetOrganizationByIdInput {
  organizationId: string;
}

export const getOrganizationByIdMapper = (req: Request): GetOrganizationByIdInput => ({
  organizationId: req.params.organizationId ?? '',
});
