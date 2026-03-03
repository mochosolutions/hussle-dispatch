import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/shared/prisma';
import { membershipRepositoryPrisma } from '../../repositories/membershipRepositoryPrisma';

export const getMembershipController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationId, membershipId } = req.params;
    const memberRepo = membershipRepositoryPrisma(prisma, organizationId);
    const membership = await memberRepo.findOneByFilter({ _id: membershipId });

    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    return res.status(200).json({ data: membership });
  } catch (error) {
    return next(error);
  }
};
