import type { Request } from 'express';
import type { GetVehicleLoadHistoryServiceInput } from '../../types/vehicleServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { getRequiredVehicleIdMapper } from './getRequiredVehicleIdMapper';

export const getVehicleLoadHistoryMapper = (req: Request): GetVehicleLoadHistoryServiceInput => {
  const context = getRequestContextMapper(req);
  const id = getRequiredVehicleIdMapper(req);

  return {
    ...context,
    id,
    query: req.query,
  };
};
