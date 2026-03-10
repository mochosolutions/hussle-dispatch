import type { Request } from 'express';
import type { ListVehiclesServiceInput } from '../../types/vehicleServiceTypes';
import type { VehicleListFilters } from '../../types/vehicleTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const listVehiclesMapper = (req: Request): ListVehiclesServiceInput => {
  const context = getRequestContextMapper(req);

  const filters: VehicleListFilters = {
    carrierId: typeof req.query['carrierId'] === 'string' ? req.query['carrierId'] : undefined,
    search: typeof req.query['search'] === 'string' ? req.query['search'] : undefined,
  };

  return {
    ...context,
    query: req.query,
    filters,
  };
};
