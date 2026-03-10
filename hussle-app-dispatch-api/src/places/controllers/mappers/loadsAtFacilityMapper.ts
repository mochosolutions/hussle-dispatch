import type { Request } from 'express';
import type { LoadsAtFacilityServiceInput } from '../../types/placeServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { getRequiredPlaceIdMapper } from './getRequiredPlaceIdMapper';

export const loadsAtFacilityMapper = (req: Request): LoadsAtFacilityServiceInput => {
  const context = getRequestContextMapper(req);
  const id = getRequiredPlaceIdMapper(req);

  return {
    id,
    organizationId: context.organizationId,
    query: req.query,
  };
};
