import type { Request } from 'express';
import type { UpdatePlaceInput } from '../../types/placeTypes';
import type { UpdatePlaceServiceInput } from '../../types/placeServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { getRequiredPlaceIdMapper } from './getRequiredPlaceIdMapper';

export const updatePlaceMapper = (req: Request): UpdatePlaceServiceInput => {
  const context = getRequestContextMapper(req);
  const id = getRequiredPlaceIdMapper(req);
  const input: UpdatePlaceInput = req.body;

  return {
    ...context,
    id,
    input,
  };
};
