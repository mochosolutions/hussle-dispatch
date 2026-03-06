import { BadRequestError } from '@mocho/common';
import { InvitationStatus } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import type { Invite } from '../../types/invite';

export interface AcceptInvitationInput {
  email: string;
  invitationToken: string;
  organizationId: string;
}

export interface AcceptInvitationDeps {
  findOneByFilter: (filter: Record<string, string>) => Promise<Invite | null>;
  updateInvite: (id: string, data: Partial<Invite>) => Promise<Invite | null>;
}

export const acceptInvitationService = async (
  { email, invitationToken, organizationId: _organizationId }: AcceptInvitationInput,
  { findOneByFilter, updateInvite }: AcceptInvitationDeps,
) => {
  try {
    // Query invitation by token
    const existingInvitation = await findOneByFilter({ token: invitationToken });

    if (!existingInvitation) {
      throw new BadRequestError('Invitation not found or expired.');
    }

    // Check if invitation is still pending
    if (existingInvitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestError('Invitation is no longer valid');
    }

    // Check if invitation has expired
    if (new Date() > new Date(existingInvitation.expiresAt)) {
      // Update status to expired using Prisma
      await updateInvite(existingInvitation.id, { status: InvitationStatus.EXPIRED });
      throw new BadRequestError('Invite link has expired');
    }

    // Verify email matches
    if (existingInvitation.email.toLowerCase() !== email.toLowerCase()) {
      throw new BadRequestError('Invitation email does not match.');
    }

    // Update invitation status to accepted using Prisma
    const updatedInvite = await updateInvite(
      existingInvitation.id,
      { status: InvitationStatus.ACCEPTED },
    );

    return {
      invite: updatedInvite,
    };
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }
    logger.error('Error accepting invitation', { error });
    throw new BadRequestError('Failed to accept invitation');
  }
};
