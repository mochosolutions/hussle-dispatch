import { BadRequestError } from '@mocho/common';
import { InvitationStatus } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import type { Invite } from '../../types/invite';

export interface AcceptInvitationInput {
  invitationToken: string;
}

export interface AcceptInvitationDeps {
  findOneByFilter: (filter: Record<string, string>) => Promise<Invite | null>;
  updateInvite: (id: string, data: Partial<Invite>) => Promise<Invite | null>;
}

export const acceptInvitationService = async (
  { invitationToken }: AcceptInvitationInput,
  { findOneByFilter, updateInvite }: AcceptInvitationDeps,
): Promise<{ invite: Invite }> => {
  try {
    const existingInvitation = await findOneByFilter({ token: invitationToken });

    if (!existingInvitation) {
      throw new BadRequestError('Invitation not found or expired.');
    }

    if (existingInvitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestError('Invitation is no longer valid');
    }

    if (new Date() > new Date(existingInvitation.expiresAt)) {
      await updateInvite(existingInvitation.id, { status: InvitationStatus.EXPIRED });
      throw new BadRequestError('Invite link has expired');
    }

    const updatedInvite = await updateInvite(
      existingInvitation.id,
      { status: InvitationStatus.ACCEPTED },
    );

    if (!updatedInvite) {
      throw new BadRequestError('Failed to update invitation status');
    }

    return { invite: updatedInvite };
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Error accepting invitation', { error });
    throw new BadRequestError('Failed to accept invitation');
  }
};
