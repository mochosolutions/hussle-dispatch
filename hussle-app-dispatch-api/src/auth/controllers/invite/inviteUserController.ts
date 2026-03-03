import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/shared/prisma';
import { inviteRepositoryPrisma } from '../../repositories/inviteRepositoryPrisma';
import { membershipRepositoryPrisma } from '../../repositories/membershipRepositoryPrisma';
import { organizationRepositoryPrisma } from '../../repositories/organizationRepositoryPrisma';
import { userRepositoryPrisma } from '../../repositories/userRepositoryPrisma';
import { inviteUserService } from '../../services/invite/inviteUserService';

export const inviteUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { users } = req.body;
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { organizationId: userOrganizationId } = req.user;
    const organizationId = req.params['organizationId'] ?? '';

    const inviteRepo = inviteRepositoryPrisma(prisma, organizationId);
    const memberShipRepo = membershipRepositoryPrisma(prisma, organizationId);
    const userRepo = userRepositoryPrisma(prisma);
    const orgRepo = organizationRepositoryPrisma(prisma);

    const invite = await inviteUserService(
      {
        users,
        organizationId,
        userOrganizationId,
      },
      {
        createInvite: inviteRepo.create,
        findInviteByFilter: inviteRepo.findInviteByFilter,
        findMembershipbyFilter: memberShipRepo.findMembershipsByFilter,
        findUserByFilter: userRepo.findUserByFilter,
        findOneOrganizationByFilter: orgRepo.findOneByFilter,
      }
    );

    return res.status(200).json({
      message: 'User invited successfully',
      invite,
    });
  } catch (error) {
    return next(error);
  }
};
