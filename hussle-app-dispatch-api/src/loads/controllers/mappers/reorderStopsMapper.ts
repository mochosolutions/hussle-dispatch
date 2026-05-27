import type { Request } from 'express';
import type { ReorderStopsInput } from '../../types/stopTypes';

export const reorderStopsMapper = (req: Request): ReorderStopsInput => ({
  organizationId: req.organizationId ?? '',
  loadId: req.params['loadId'] ?? '',
  stopOrder: req.body.stopOrder,
});
