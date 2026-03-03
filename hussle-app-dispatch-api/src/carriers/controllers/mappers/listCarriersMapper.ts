import { CarrierType } from '@prisma/client';
import type { Request } from 'express';
import type { CarrierListFilters } from '../../types/carrierTypes';
import type { ListCarriersServiceInput } from '../../types/carrierServiceTypes';
import { getRequestContextMapper } from './getRequestContextMapper';

const parseCarrierType = (value: unknown): CarrierType | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const enumValues = Object.values(CarrierType);
  const matched = enumValues.find((enumValue) => enumValue === value);
  return matched;
};

export const listCarriersMapper = (req: Request): ListCarriersServiceInput => {
  const context = getRequestContextMapper(req);

  const filters: CarrierListFilters = {
    type: parseCarrierType(req.query['type']),
    search: typeof req.query['search'] === 'string' ? req.query['search'] : undefined,
  };

  return {
    ...context,
    query: req.query,
    filters,
  };
};
