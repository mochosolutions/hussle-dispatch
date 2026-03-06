import type { Request } from 'express';

export interface AcceptInviteInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  invitationToken: string;
  organizationId: string;
  userOrganizationId: string;
}

export const acceptInviteMapper = (req: Request): AcceptInviteInput => ({
  email: req.body.email,
  password: req.body.password,
  firstName: req.body.firstName,
  lastName: req.body.lastName,
  role: req.body.role,
  invitationToken: req.body.invitationToken,
  organizationId: req.body.organizationId,
  userOrganizationId: req.body.userOrganizationId,
});
