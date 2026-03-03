import type { Request, Response } from 'express';
import { prisma } from '@/shared/prisma';
import { organizationRepositoryPrisma } from '../../repositories/organizationRepositoryPrisma';
import { getAllOrgService } from '../../services';

export const getOrganizationsController = async (req: Request, res: Response) => {
  const orgRepo = organizationRepositoryPrisma(prisma);
  const result = await getAllOrgService({
    findAll: orgRepo.findAllOrganizations,
  });
  return res.status(200).json({
    message: 'Organizations retrieved successfully',
    organizations: result,
  });
};
