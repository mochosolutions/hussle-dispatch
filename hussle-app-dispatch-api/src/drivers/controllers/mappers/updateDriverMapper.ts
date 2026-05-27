import type { Request } from 'express';
import type { UpdateDriverInput } from '../../types/driverTypes';
import type { UpdateDriverServiceInput } from '../../types/driverServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { getRequiredDriverIdMapper } from './getRequiredDriverIdMapper';

export const updateDriverMapper = (req: Request): UpdateDriverServiceInput => {
  const context = getRequestContextMapper(req);
  const id = getRequiredDriverIdMapper(req);
  const input: UpdateDriverInput = req.body;

  return {
    ...context,
    id,
    input,
  };
};
