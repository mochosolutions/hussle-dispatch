import type { Request } from 'express';
import type { LoadStatus } from '@prisma/client';
import { UnauthorizedError } from '@/shared/errors';
import type { TransitionStatusInput } from '../../types/loadStatusTypes';

export const transitionStatusMapper = (req: Request): TransitionStatusInput => {
  const loadId = req.params['id'];
  const organizationId = req.organizationId;
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (
    loadId === undefined ||
    organizationId === undefined ||
    userId === undefined ||
    userRole === undefined
  ) {
    throw new UnauthorizedError('Authentication required');
  }

  const body = req.body as {
    status: LoadStatus;
    notes?: string;
    overrideWarnings?: boolean;
  };

  return {
    loadId,
    organizationId,
    targetStatus: body.status,
    notes: body.notes,
    overrideWarnings: body.overrideWarnings,
    userId,
    userRole,
  };
};
