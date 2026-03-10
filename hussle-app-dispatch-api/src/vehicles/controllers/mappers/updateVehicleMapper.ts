import type { Request } from 'express';
import type { UpdateVehicleInput } from '../../types/vehicleTypes';
import type { UpdateVehicleServiceInput } from '../../types/vehicleServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { getRequiredVehicleIdMapper } from './getRequiredVehicleIdMapper';

export const updateVehicleMapper = (req: Request): UpdateVehicleServiceInput => {
  const context = getRequestContextMapper(req);
  const id = getRequiredVehicleIdMapper(req);
  const input: UpdateVehicleInput = req.body;

  return {
    ...context,
    id,
    input,
  };
};
