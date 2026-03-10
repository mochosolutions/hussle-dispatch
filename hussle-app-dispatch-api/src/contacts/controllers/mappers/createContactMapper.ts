import type { Request } from 'express';
import type { CreateContactInput } from '../../types/contactTypes';
import type { CreateContactServiceInput } from '../../types/contactServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const createContactMapper = (req: Request): CreateContactServiceInput => {
  const context = getRequestContextMapper(req);
  const input: CreateContactInput = req.body;

  return {
    ...context,
    input,
  };
};
