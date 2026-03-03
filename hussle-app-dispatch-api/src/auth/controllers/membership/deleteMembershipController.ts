import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/shared/prisma';
import { membershipRepositoryPrisma } from '../../repositories/membershipRepositoryPrisma';

export const deleteMembershipController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.params['organizationId'] ?? '';
    const membershipId = req.params['membershipId'] ?? '';
    const memberRepo = membershipRepositoryPrisma(prisma, organizationId);
    const deletedMembership = await memberRepo.deleteMembership(membershipId);

    if (!deletedMembership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    return res
      .status(200)
      .json({ message: 'Membership deleted successfully', data: deletedMembership });
  } catch (error) {
    return next(error);
  }
};
