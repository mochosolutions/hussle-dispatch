import type { Request } from 'express';
import type { TypeaheadServiceInput } from '../../types/placeServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

export const typeaheadMapper = (req: Request): TypeaheadServiceInput => {
  const context = getRequestContextMapper(req);
  const query = typeof req.query['q'] === 'string' ? req.query['q'] : '';
  const rawLimit = Number(req.query['limit']);
  const parsedLimit = Number.isInteger(rawLimit) && rawLimit >= 1 ? rawLimit : DEFAULT_LIMIT;
  const limit = Math.min(parsedLimit, MAX_LIMIT);

  return {
    organizationId: context.organizationId,
    query,
    limit,
  };
};
