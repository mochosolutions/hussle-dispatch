import type { Request } from 'express';
import { RequestValidationError } from '@/shared/errors/requestValidationError';

export const getRequiredContactIdMapper = (req: Request): string => {
  const id = req.params['id'];

  if (id === undefined || id.trim().length === 0) {
    throw new RequestValidationError([
      {
        message: 'id is required',
        field: 'id',
      },
    ]);
  }

  return id;
};
