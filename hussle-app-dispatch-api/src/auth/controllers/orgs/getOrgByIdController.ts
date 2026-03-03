import type { Request, Response } from 'express';
import { prisma } from '@/shared/prisma';
import { organizationRepositoryPrisma } from '../../repositories/organizationRepositoryPrisma';
import { getAllOrgByIdService } from '../../services';

export const getOrganizationsByIdController = async (req: Request, res: Response) => {
  const orgRepo = organizationRepositoryPrisma(prisma);
  const result = await getAllOrgByIdService(
    { id: req.params['organizationId'] ?? '' },
    {
      findById: orgRepo.findOrganizationById,
    }
  );
  return res.status(200).json({
    message: 'Organizations retrieved successfully',
    organization: result,
  });
};
