import type { Request } from 'express';
import type { CreatePlaceInput } from '../../types/placeTypes';
import type { CreatePlaceServiceInput } from '../../types/placeServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const createPlaceMapper = (req: Request): CreatePlaceServiceInput => {
  const context = getRequestContextMapper(req);
  const input: CreatePlaceInput = req.body;

  return {
    ...context,
    input,
  };
};
