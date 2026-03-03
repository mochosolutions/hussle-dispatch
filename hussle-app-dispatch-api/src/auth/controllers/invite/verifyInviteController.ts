import { BadRequestError } from '@mocho/common';
import type { NextFunction, Request, Response } from 'express';
import { InvitationStatus } from '@prisma/client';
import { prisma } from '@/shared/prisma';
import { logger } from '@/shared/utils/logger';
import { inviteRepositoryPrisma } from '../../repositories/inviteRepositoryPrisma';
import { organizationRepositoryPrisma } from '../../repositories/organizationRepositoryPrisma';
import { userRepositoryPrisma } from '../../repositories/userRepositoryPrisma';

export const verifyInviteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invitationToken = req.query.invitationToken as string;
    const { organizationId } = req.params;

    if (!invitationToken) {
      throw new BadRequestError('Missing token');
    }

    const inviteRepo = inviteRepositoryPrisma(prisma, organizationId);
    const orgRepo = organizationRepositoryPrisma(prisma);
    const userRepo = userRepositoryPrisma(prisma);

    const existingInvitation = await inviteRepo.findOneByFilter({ token: invitationToken });
    logger.debug('Invitation lookup', {
      invitationId: existingInvitation?.id,
      status: existingInvitation?.status,
    });

    if (!existingInvitation) {
      throw new BadRequestError('Invalid or expired invite');
    }

    if (existingInvitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestError('Invitation is no longer valid');
    }

    if (new Date() > new Date(existingInvitation.expiresAt)) {
      inviteRepo.updateInvite(existingInvitation.id, { status: InvitationStatus.EXPIRED });
      // existingInvitation.status = 'expired';
      // await existingInvitation.save();
      throw new BadRequestError('Invite link has expired');
    }

    const organization = await orgRepo.findOrganizationById(existingInvitation.organizationId);
    logger.debug('Organization lookup', { organizationId: existingInvitation.organizationId });

    if (!organization) {
      throw new BadRequestError('Organization no longer exists');
    }

    const userExists = await userRepo.findUserByEmail(existingInvitation.email);
    logger.debug('User existence check', { exists: !!userExists });

    return res.status(200).json({
      message: 'Invite verified successfully',
      invite: {
        email: existingInvitation.email,
        role: existingInvitation.role,
        organizationId: existingInvitation.organizationId,
        expiresAt: existingInvitation.expiresAt,
      },
      userExists: !!userExists,
    });
  } catch (error) {
    return next(error);
  }
};
