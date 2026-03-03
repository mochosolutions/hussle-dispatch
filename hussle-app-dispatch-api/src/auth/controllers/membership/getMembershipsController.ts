import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/shared/prisma';
import { isAdminOrSupport } from '@/shared/constants/roles';
import { membershipRepositoryPrisma } from '../../repositories/membershipRepositoryPrisma';
import { getUsersMembershipService, getMembershipService } from '../../services';

export const getUserMembershipController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;
    const { organizationId } = req.params;
    const memberRepo = membershipRepositoryPrisma(prisma, organizationId);
    const result = await getUsersMembershipService(userId, {
      findByUserId: memberRepo.findMembershipsByUserId,
    });
    return res.status(200).json({
      message: 'Organization updated successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const getMembershipController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Admin/support users can view any org's memberships via URL param
    // Regular users can only view their own organization
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const isPrivileged = req.user.role === 'SystemAdmin' || req.user.role === 'CustomerSupport';
    const organizationId =
      isPrivileged && req.params.organizationId
        ? req.params.organizationId
        : req.user.organizationId;

    const memberRepo = membershipRepositoryPrisma(prisma, organizationId);
    const result = await getMembershipService({
      findAllMemberships: memberRepo.findMembershipByOrg,
    });
    return res.status(200).json({
      message: 'Memberships retrieved successfully',
      memberships: result,
    });
  } catch (error) {
    return next(error);
  }
};
