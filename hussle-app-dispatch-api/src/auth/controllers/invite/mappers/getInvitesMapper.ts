import type { Request } from 'express';

export interface GetInvitesInput {
  organizationId: string;
}

export const getInvitesMapper = (req: Request): GetInvitesInput => ({
  organizationId: String(req.params.organizationId),
});
