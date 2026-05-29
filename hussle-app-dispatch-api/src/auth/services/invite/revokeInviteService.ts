import { BadRequestError } from '@mocho/common';
import { InvitationStatus } from '@prisma/client';
import type { Invite } from '../../types/invite';

export interface RevokeInviteInput {
  organizationId: string;
  inviteId: string;
}

export interface RevokeInviteDeps {
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
 * Revokes a pending (or expired) invitation, freeing its seat.
 * The org-scoped lookup doubles as the tenant-ownership guard.
 */
export const revokeInviteService = async (
  { organizationId, inviteId }: RevokeInviteInput,
  { findOneByFilter, updateInvite }: RevokeInviteDeps,
): Promise<{ invite: Invite }> => {
  const existing = await findOneByFilter(organizationId, { id: inviteId });

  if (!existing) {
    throw new BadRequestError('Invitation not found');
  }

  if (existing.status === InvitationStatus.ACCEPTED) {
    throw new BadRequestError('Cannot revoke an invitation that has already been accepted');
  }

  if (existing.status === InvitationStatus.REVOKED) {
    return { invite: existing };
  }

  const updated = await updateInvite(organizationId, inviteId, {
    status: InvitationStatus.REVOKED,
  });

  if (!updated) {
    throw new BadRequestError('Failed to revoke invitation');
  }

  return { invite: updated };
};
