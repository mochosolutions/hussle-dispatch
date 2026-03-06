import { BadRequestError } from '@mocho/common';
import type { Invite } from '../../types/invite';

export const getInvitesService = async (
  organizationId: string,
  { findAllInvites }: { findAllInvites: (filter?: { organizationId?: string }) => Promise<Invite[]> }
) => {
  try {
    const invites = await findAllInvites({ organizationId });
    return invites;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get invites';
    throw new BadRequestError(message);
  }
};
