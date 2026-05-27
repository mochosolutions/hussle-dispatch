import type { Invite } from '../../../types/invite';

export interface InviteResponse {
  id: string;
  organizationId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  token: string;
  status: string;
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
  updatedAt: string;
}

export const toInviteResponse = (invite: Invite): InviteResponse => ({
  id: invite.id,
  organizationId: invite.organizationId,
  email: invite.email,
  firstName: invite.firstName ?? null,
  lastName: invite.lastName ?? null,
  role: invite.role,
  token: invite.token,
  status: invite.status,
  expiresAt: invite.expiresAt,
  invitedBy: invite.invitedBy,
  createdAt: invite.createdAt,
  updatedAt: invite.updatedAt,
});

export const toInviteListResponse = (invites: Invite[]): InviteResponse[] =>
  invites.map(toInviteResponse);
