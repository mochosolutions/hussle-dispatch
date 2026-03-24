import type { Request } from 'express';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import type { AssignLoadServiceInput } from '../../types/loadServiceTypes';
import type { LoadAssignmentInput } from '../../types/loadTypes';
import { getRequiredLoadIdMapper } from './getRequiredLoadIdMapper';

export const assignLoadMapper = (req: Request): AssignLoadServiceInput => {
  const context = getRequestContextMapper(req);
  const id = getRequiredLoadIdMapper(req);
  const input: LoadAssignmentInput = req.body;

  return {
    ...context,
    id,
    input,
  };
};
