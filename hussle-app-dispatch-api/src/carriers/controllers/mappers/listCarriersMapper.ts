import { CarrierStatus, CarrierType } from '@prisma/client';
import type { Request } from 'express';
import type { CarrierListFilters } from '../../types/carrierTypes';
import type { ListCarriersServiceInput } from '../../types/carrierServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

const parseCarrierType = (value: unknown): CarrierType | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const enumValues = Object.values(CarrierType);
  const matched = enumValues.find((enumValue) => enumValue === value);
  return matched;
};

const STATUS_VALUES = new Set<string>(Object.values(CarrierStatus));

const parseCarrierStatuses = (value: unknown): CarrierStatus[] | undefined => {
  // Accept either repeated query params (?status=X&status=Y) or a single CSV string.
  let raw: string[] = [];
  if (Array.isArray(value)) {
    raw = value.filter((v): v is string => typeof v === 'string');
  } else if (typeof value === 'string') {
    raw = value.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  }
  if (raw.length === 0) {
    return undefined;
  }
  const valid = raw.filter((s) => STATUS_VALUES.has(s)) as CarrierStatus[];
  return valid.length > 0 ? valid : undefined;
};

export const listCarriersMapper = (req: Request): ListCarriersServiceInput => {
  const context = getRequestContextMapper(req);

  const status = parseCarrierStatuses(req.query['status']);

  const filters: CarrierListFilters = {
    type: parseCarrierType(req.query['type']),
    search: typeof req.query['search'] === 'string' ? req.query['search'] : undefined,
    ...(status !== undefined && { status }),
  };

  return {
    ...context,
    query: req.query,
    filters,
  };
};
