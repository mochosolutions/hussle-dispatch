import type { Request } from 'express';
import type { AddressSearchInput } from '../../types/addressSearchTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

export const addressSearchMapper = (req: Request): AddressSearchInput => {
  const context = getRequestContextMapper(req);
  const query = typeof req.query['query'] === 'string' ? req.query['query'] : '';
  const rawLimit = Number(req.query['limit']);
  const parsedLimit = Number.isInteger(rawLimit) && rawLimit >= 1 ? rawLimit : DEFAULT_LIMIT;
  const limit = Math.min(parsedLimit, MAX_LIMIT);

  return {
    organizationId: context.organizationId,
    query,
    limit,
  };
};
