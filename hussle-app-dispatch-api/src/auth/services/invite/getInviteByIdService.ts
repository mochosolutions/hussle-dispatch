import { BadRequestError } from '@mocho/common';
import type { Invite } from '../../types/invite';

export interface GetInviteByIdDeps {
  findInviteById: (id: string) => Promise<Invite | null>;
}

export const getInviteByIdService = async (
  inviteId: string,
  { findInviteById }: GetInviteByIdDeps
) => {
  try {
    const invite = await findInviteById(inviteId);
    return invite;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get invite';
    throw new BadRequestError(message);
  }
};
