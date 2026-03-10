import type { Request } from 'express';
import { UnauthorizedError } from '@/shared/errors';

export const getRequiredLoadIdMapper = (req: Request): string => {
  const id = req.params['id'];

  if (id === undefined || id.length === 0) {
    throw new UnauthorizedError('Missing required id parameter');
  }

  return id;
};
