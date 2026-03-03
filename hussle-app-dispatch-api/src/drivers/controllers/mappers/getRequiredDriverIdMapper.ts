import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

export const getRequiredDriverIdMapper = (req: Request): string => {
  const id = req.params['id'];

  if (id === undefined || id.length === 0) {
    throw new ValidationError('id is required');
  }

  return id;
};
