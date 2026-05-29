import { BadRequestError } from '@mocho/common';
import { InvitationStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import type { Invite } from '../../types/invite';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface ResendInviteInput {
  organizationId: string;
  inviteId: string;
}

export interface ResendInviteDeps {
  findOneByFilter: (
    organizationId: string,
    filter: Record<string, unknown>,
  ) => Promise<Invite | null>;
  updateInvite: (
    organizationId: string,
    id: string,
    data: Partial<Invite>,
  ) => Promise<Invite | null>;
}

/**
 * Re-issues a pending or expired invitation: mints a fresh token, resets the
 * expiry window, and returns the updated invite for the caller to re-notify.
 * The org-scoped lookup doubles as the tenant-ownership guard.
 */
export const resendInviteService = async (
  { organizationId, inviteId }: ResendInviteInput,
  { findOneByFilter, updateInvite }: ResendInviteDeps,
): Promise<{ invite: Invite }> => {
  const existing = await findOneByFilter(organizationId, { id: inviteId });

  if (!existing) {
    throw new BadRequestError('Invitation not found');
  }

  if (existing.status === InvitationStatus.ACCEPTED) {
    throw new BadRequestError('This invitation has already been accepted');
  }

  if (existing.status === InvitationStatus.REVOKED) {
    throw new BadRequestError('This invitation was revoked; create a new invite instead');
  }

  const updated = await updateInvite(organizationId, inviteId, {
    token: uuidv4(),
    status: InvitationStatus.PENDING,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
  });

  if (!updated) {
    throw new BadRequestError('Failed to resend invitation');
  }

  return { invite: updated };
};
