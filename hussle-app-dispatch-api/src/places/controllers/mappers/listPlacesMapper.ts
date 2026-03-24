import { FacilityType } from '@prisma/client';
import type { Request } from 'express';
import type { PlaceListFilters } from '../../types/placeTypes';
import type { ListPlacesServiceInput } from '../../types/placeServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

const parseFacilityType = (value: unknown): FacilityType | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const enumValues = Object.values(FacilityType);
  const matched = enumValues.find((enumValue) => enumValue === value);
  return matched;
};

export const listPlacesMapper = (req: Request): ListPlacesServiceInput => {
  const context = getRequestContextMapper(req);

  const filters: PlaceListFilters = {
    search: typeof req.query['search'] === 'string' ? req.query['search'] : undefined,
    facilityType: parseFacilityType(req.query['facilityType']),
    state: typeof req.query['state'] === 'string' ? req.query['state'] : undefined,
    contactId: typeof req.query['contactId'] === 'string' ? req.query['contactId'] : undefined,
    customerId: typeof req.query['customerId'] === 'string' ? req.query['customerId'] : undefined,
  };

  return {
    ...context,
    query: req.query,
    filters,
  };
};
