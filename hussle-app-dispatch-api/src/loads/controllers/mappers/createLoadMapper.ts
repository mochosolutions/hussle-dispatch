import type { Request } from 'express';
import type { CreateLoadInput } from '../../types/loadTypes';
import type { CreateLoadServiceInput } from '../../types/loadServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const createLoadMapper = (req: Request): CreateLoadServiceInput => {
  const context = getRequestContextMapper(req);
  const input: CreateLoadInput = req.body;

  return {
    ...context,
    input,
  };
};
