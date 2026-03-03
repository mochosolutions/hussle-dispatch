import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/shared/prisma';
import { membershipRepositoryPrisma } from '../../repositories/membershipRepositoryPrisma';
import { userRepositoryPrisma } from '../../repositories/userRepositoryPrisma';
import { currentUserService } from '../../services';

export const getCurrentUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req?.user; // Assuming `req.user` is populated by a middleware
    const membershipRepo = membershipRepositoryPrisma(prisma);
    const userRepo = userRepositoryPrisma(prisma);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const serviceUser = {
      userId: user.userId,
      email: user.email ?? '',
      role: user.role,
      organizationId: user.organizationId,
    };

    const result = await currentUserService(
      { user: serviceUser },
      {
        findUserByIdWithMemberships: userRepo.findUserByIdWithMemberships,
      }
    );

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { user: formattedUser, accessibleOrgs } = result;

    return res
      .status(200)
      .json({ accessibleOrgs, user: formattedUser, message: 'Current user fetched successfully' });
  } catch (error) {
    return next(error);
  }
};

export default getCurrentUserController;
