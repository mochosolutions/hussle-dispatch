import type { Request } from 'express';
import type { BackhaulSearchInput } from '../../types/backhaulTypes';

export const backhaulMapper = (
  req: Request,
): { orgId: string; input: BackhaulSearchInput } => ({
  orgId: req.organizationId ?? '',
  input: {
    fromCity: req.query['fromCity'] as string,
    fromState: req.query['fromState'] as string,
    radius: Number(req.query['radius']),
    earliestPickup: req.query['earliestPickup'] as string,
  },
});

export const chainMapper = (
  req: Request,
): { orgId: string; loadHash: string; vehicleId: string; limit: number } => ({
  orgId: req.organizationId ?? '',
  loadHash: req.params['id'] ?? '',
  vehicleId: req.query['vehicleId'] as string,
  limit: Number(req.query['limit']) || 3,
});
