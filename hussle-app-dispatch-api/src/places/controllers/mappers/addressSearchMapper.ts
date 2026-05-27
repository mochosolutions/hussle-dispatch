import type { Request } from 'express';
import type { AddressSearchInput } from '../../types/addressSearchTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

const parseOptionalNumber = (raw: unknown): number | null => {
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

export const addressSearchMapper = (req: Request): AddressSearchInput => {
  const context = getRequestContextMapper(req);
  const query = typeof req.query['query'] === 'string' ? req.query['query'] : '';
  const rawLimit = Number(req.query['limit']);
  const parsedLimit = Number.isInteger(rawLimit) && rawLimit >= 1 ? rawLimit : DEFAULT_LIMIT;
  const limit = Math.min(parsedLimit, MAX_LIMIT);

  const biasLat = parseOptionalNumber(req.query['biasLat']);
  const biasLng = parseOptionalNumber(req.query['biasLng']);

  return {
    organizationId: context.organizationId,
    query,
    limit,
    biasLat,
    biasLng,
  };
};
