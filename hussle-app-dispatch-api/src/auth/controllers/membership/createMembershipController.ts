import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/shared/prisma';
import { membershipRepositoryPrisma } from '../../repositories/membershipRepositoryPrisma';
import { createMembershipService } from '../../services';

export const createOrgMembershipController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, role } = req.body;
    const organizationId = req.params['organizationId'] ?? '';
    const createMemberPayload = {
      userId,
      organizationId,
      role,
      status: 'active',
    };
    const memberRepo = membershipRepositoryPrisma(prisma, organizationId);
    const result = await createMembershipService(createMemberPayload, {
      create: memberRepo.create,
      findOneByFilter: memberRepo.findOneByFilter,
    });
    return res.status(200).json({
      message: 'Organization updated successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
