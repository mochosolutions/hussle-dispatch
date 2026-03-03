import { BadRequestError } from '@mocho/common';
import type { Invite } from '../../types/invite';

export interface GetInviteByIdDeps {
  findInviteById: (id: string, context?: any) => Promise<Invite | null>;
}

export const getInviteByIdService = async (
  inviteId: string,
  { findInviteById }: GetInviteByIdDeps
) => {
  try {
    const invite = await findInviteById(inviteId);
    return invite;
  } catch (error: any) {
    throw new BadRequestError(error.message);
  }
};
