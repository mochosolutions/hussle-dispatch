import type { Request } from 'express';
import type { CreateDriverInput } from '../../types/driverTypes';
import type { CreateDriverServiceInput } from '../../types/driverServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const createDriverMapper = (req: Request): CreateDriverServiceInput => {
  const context = getRequestContextMapper(req);
  const input: CreateDriverInput = req.body;

  return {
    ...context,
    input,
  };
};
