import { BadRequestError } from '@mocho/common';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/shared/prisma';
import { inviteRepositoryPrisma } from '../../repositories/inviteRepositoryPrisma';
import { organizationRepositoryPrisma } from '../../repositories/organizationRepositoryPrisma';
import { userRepositoryPrisma } from '../../repositories/userRepositoryPrisma';

export const getInvitesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // const invitationToken = req.query.invitationToken as string;
    const { organizationId } = req.params;
    const inviteRepo = inviteRepositoryPrisma(prisma, organizationId);
    const orgRepo = organizationRepositoryPrisma(prisma);
    const userRepo = userRepositoryPrisma(prisma);

    const invites = await inviteRepo.findAllInvites();

    return res.status(200).json({
      message: 'Invite verified successfully',
      invites,
    });
  } catch (error) {
    return next(error);
  }
};
