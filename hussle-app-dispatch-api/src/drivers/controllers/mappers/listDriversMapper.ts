import type { Request } from 'express';
import type { DriverListFilters } from '../../types/driverTypes';
import type { ListDriversServiceInput } from '../../types/driverServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const listDriversMapper = (req: Request): ListDriversServiceInput => {
  const context = getRequestContextMapper(req);

  const filters: DriverListFilters = {
    carrierId: typeof req.query['carrierId'] === 'string' ? req.query['carrierId'] : undefined,
    search: typeof req.query['search'] === 'string' ? req.query['search'] : undefined,
  };

  return {
    ...context,
    query: req.query,
    filters,
  };
};
