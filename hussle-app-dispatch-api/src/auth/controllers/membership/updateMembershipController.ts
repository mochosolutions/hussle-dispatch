import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/shared/prisma';
import { membershipRepositoryPrisma } from '../../repositories/membershipRepositoryPrisma';

export const updateMembershipController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.params['organizationId'] ?? '';
    const membershipId = req.params['membershipId'] ?? '';
    const updates = req.body;
    const memberRepo = membershipRepositoryPrisma(prisma, organizationId);
    const updatedMembership = await memberRepo.updateMembership(membershipId, updates);

    if (!updatedMembership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    return res
      .status(200)
      .json({ message: 'Membership updated successfully', data: updatedMembership });
  } catch (error) {
    return next(error);
  }
};
