import { BadRequestError } from '@mocho/common';
import { logger } from '@/shared/utils/logger';

export interface AcceptInvitationInput {
  email: string;
  invitationToken: string;
  organizationId: string;
}

export interface AcceptInvitationDeps {
  findOneByFilter: (filter: Record<string, any>, context?: any) => Promise<any | null>;
  updateInvite: (id: string, data: any, context?: any) => Promise<any>;
}

export const acceptInvitationService = async (
  { email, invitationToken, organizationId }: AcceptInvitationInput,
  { findOneByFilter, updateInvite }: AcceptInvitationDeps,
  context?: any
) => {
  try {
    // Query invitation by token
    const existingInvitation = await findOneByFilter({ token: invitationToken }, context);

    if (!existingInvitation) {
      throw new BadRequestError('Invitation not found or expired.');
    }

    // Check if invitation is still pending
    if (existingInvitation.status !== 'PENDING') {
      throw new BadRequestError('Invitation is no longer valid');
    }

    // Check if invitation has expired
    if (new Date() > new Date(existingInvitation.expiresAt)) {
      // Update status to expired using Prisma
      await updateInvite(existingInvitation.id, { status: 'EXPIRED' }, context);
      throw new BadRequestError('Invite link has expired');
    }

    // Verify email matches
    if (existingInvitation.email.toLowerCase() !== email.toLowerCase()) {
      throw new BadRequestError('Invitation email does not match.');
    }

    // Update invitation status to accepted using Prisma
    const updatedInvite = await updateInvite(
      existingInvitation.id,
      { status: 'ACCEPTED' },
      context
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
