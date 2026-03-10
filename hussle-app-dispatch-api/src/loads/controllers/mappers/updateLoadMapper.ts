import type { Request } from 'express';
import type { UpdateLoadInput } from '../../types/loadTypes';
import type { UpdateLoadServiceInput } from '../../types/loadServiceTypes';
import { getRequiredLoadIdMapper } from './getRequiredLoadIdMapper';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const updateLoadMapper = (req: Request): UpdateLoadServiceInput => {
  const context = getRequestContextMapper(req);
  const id = getRequiredLoadIdMapper(req);
  const input: UpdateLoadInput = req.body;

  return {
    ...context,
    id,
    input,
  };
};
