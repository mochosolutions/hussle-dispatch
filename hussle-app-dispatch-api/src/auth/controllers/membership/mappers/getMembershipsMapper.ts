import type { Request } from 'express';

export interface GetMembershipsInput {
  organizationId: string;
}

export const getMembershipsMapper = (req: Request): GetMembershipsInput => ({
  organizationId: String(req.params.organizationId),
});
