import type { Request } from 'express';
import type { ReorderStopsInput } from '../../types/stopTypes';
import { UnauthorizedError } from '@/shared/errors';

export const reorderStopsMapper = (req: Request): ReorderStopsInput => {
  const organizationId = req.organizationId;
  const loadId = req.params['loadId'];

  if (organizationId === undefined || loadId === undefined) {
    throw new UnauthorizedError('Authentication required');
  }

  return {
    organizationId,
    loadId,
    stopOrder: req.body.stopOrder,
  };
};
