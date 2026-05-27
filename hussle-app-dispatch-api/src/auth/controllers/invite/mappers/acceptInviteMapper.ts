import type { Request } from 'express';

export interface AcceptInviteInput {
  invitationToken: string;
  password: string;
}

export const acceptInviteMapper = (req: Request): AcceptInviteInput => ({
  invitationToken: req.body.invitationToken,
  password: req.body.password,
});
