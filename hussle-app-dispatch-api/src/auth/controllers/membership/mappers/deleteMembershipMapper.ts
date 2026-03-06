import type { Request } from 'express';

export interface DeleteMembershipInput {
  organizationId: string;
  membershipId: string;
}

export const deleteMembershipMapper = (req: Request): DeleteMembershipInput => ({
  organizationId: req.params.organizationId ?? '',
  membershipId: req.params.membershipId ?? '',
});
