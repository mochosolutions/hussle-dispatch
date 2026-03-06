import type { Request } from 'express';
import type { VerifyInviteInput } from '../../../services/invite/verifyInviteService';

export const verifyInviteMapper = (req: Request): VerifyInviteInput => ({
  invitationToken: String(req.query.invitationToken ?? ''),
  organizationId: req.params.organizationId ?? '',
});
