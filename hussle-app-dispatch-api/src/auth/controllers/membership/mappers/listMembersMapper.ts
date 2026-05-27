import type { Request } from 'express';

export interface ListMembersInput {
  organizationId: string;
}

export const listMembersMapper = (req: Request): ListMembersInput => ({
  organizationId: req.user?.organizationId ?? '',
});
