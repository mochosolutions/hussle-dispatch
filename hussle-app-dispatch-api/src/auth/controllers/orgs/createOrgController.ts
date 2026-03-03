import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@/shared/prisma';
import { logger } from '@/shared/utils/logger';
import { organizationRepositoryPrisma } from '../../repositories/organizationRepositoryPrisma';
import { createOrganizationService } from '../../services';

export const createOrganizationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestPayload = req.body;
    const orgRepo = organizationRepositoryPrisma(prisma);
    logger.info('Create organization request received');
    const result = await createOrganizationService(
      requestPayload,
      {
        create: orgRepo.createOrganization,
        findByName: orgRepo.findOrganizationByName,
      },
      null
    );
    return res.status(201).json({
      message: 'Organization created successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
