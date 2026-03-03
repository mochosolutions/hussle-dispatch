import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/shared/prisma';
import { organizationRepositoryPrisma } from '../../repositories/organizationRepositoryPrisma';
import { updateOrganizationService } from '../../services';

export const updateOrganizationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgRepo = organizationRepositoryPrisma(prisma);
    const result = await updateOrganizationService(
      { id: req.params.organizationId, ...req.body },
      {
        findOrganizationById: orgRepo.findOrganizationById,
        updateOrganization: orgRepo.updateOrganization,
      }
    );
    return res.status(200).json({
      message: 'Organization updated successfully',
      organization: result,
    });
  } catch (error) {
    return next(error);
  }
};
