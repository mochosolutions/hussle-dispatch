import { BadRequestError } from '@mocho/common';
import type { Invite } from '../../types/invite';

export const getInvitesService = async (
  organizationId: string,
  { findAllInvites }: { findAllInvites: (context?: any) => Promise<Invite[]> }
) => {
  try {
    const invites = await findAllInvites({ organizationId });
    return invites;
  } catch (error: any) {
    throw new BadRequestError(error.message);
  }
};
