import type { Request } from 'express';
import type { UpdateContactInput } from '../../types/contactTypes';
import type { UpdateContactServiceInput } from '../../types/contactServiceTypes';
import { getRequiredContactIdMapper } from './getRequiredContactIdMapper';
import { getRequestContextMapper } from './getRequestContextMapper';

export const updateContactMapper = (req: Request): UpdateContactServiceInput => {
  const context = getRequestContextMapper(req);
  const id = getRequiredContactIdMapper(req);
  const input: UpdateContactInput = req.body;

  return {
    ...context,
    id,
    input,
  };
};
