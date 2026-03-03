import type { Request } from 'express';
import type { CreateVehicleInput } from '../../types/vehicleTypes';
import type { CreateVehicleServiceInput } from '../../types/vehicleServiceTypes';
import { getRequestContextMapper } from './getRequestContextMapper';

export const createVehicleMapper = (req: Request): CreateVehicleServiceInput => {
  const context = getRequestContextMapper(req);
  const input: CreateVehicleInput = req.body;

  return {
    ...context,
    input,
  };
};
