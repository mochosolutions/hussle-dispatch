import type { Request } from 'express';
import type { LoadStatus } from '@prisma/client';
import type { TransitionStatusInput } from '../../types/loadStatusTypes';

export const transitionStatusMapper = (req: Request): TransitionStatusInput => {
  const body = req.body as {
    status: LoadStatus;
    notes?: string;
    overrideWarnings?: boolean;
    version?: number;
  };

  return {
    loadId: req.params['id'] ?? '',
    organizationId: req.organizationId ?? '',
    targetStatus: body.status,
    notes: body.notes,
    overrideWarnings: body.overrideWarnings,
    userId: req.user?.userId ?? '',
    userRole: req.user?.role ?? '',
    version: body.version,
  };
};
