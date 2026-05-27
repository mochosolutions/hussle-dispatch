import type { Request } from 'express';
import type { AssignDriverServiceInput } from '../../types/vehicleServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { getRequiredVehicleIdMapper } from './getRequiredVehicleIdMapper';

export const assignDriverMapper = (req: Request): AssignDriverServiceInput => {
  const context = getRequestContextMapper(req);
  const id = getRequiredVehicleIdMapper(req);
  const { driverId } = req.body as { driverId: string };

  return {
    ...context,
    id,
    driverId,
  };
};
