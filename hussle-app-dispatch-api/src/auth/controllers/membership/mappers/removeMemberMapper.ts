import type { Request } from 'express';

export interface RemoveMemberInput {
  organizationId: string;
  membershipId: string;
  requestingUserId: string;
}

export const removeMemberMapper = (req: Request): RemoveMemberInput => ({
  organizationId: req.user?.organizationId ?? '',
  membershipId: String(req.params.membershipId),
  requestingUserId: req.user?.userId ?? '',
});
