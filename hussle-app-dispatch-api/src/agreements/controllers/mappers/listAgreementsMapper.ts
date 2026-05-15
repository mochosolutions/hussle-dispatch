import type { Request } from 'express';

import type {
  AgreementStatus,
  AgreementTemplateKey,
  ListAgreementsFilters,
} from '../../types/agreementTypes';

const parseDate = (value: unknown): Date | undefined => {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
};

const parsePositiveInt = (value: unknown, fallback: number): number => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
};

/**
 * Map GET /api/v1/agreements query string to ListAgreementsFilters.
 * Defaults page=1, limit=20.
 */
export const listAgreementsMapper = (req: Request): ListAgreementsFilters => {
  const query = req.query;
  return {
    organizationId: req.organizationId ?? '',
    carrierId: typeof query['carrierId'] === 'string' ? query['carrierId'] : undefined,
    status: typeof query['status'] === 'string' ? (query['status'] as AgreementStatus) : undefined,
    templateKey:
      typeof query['templateKey'] === 'string'
        ? (query['templateKey'] as AgreementTemplateKey)
        : undefined,
    createdAfter: parseDate(query['createdAfter']),
    createdBefore: parseDate(query['createdBefore']),
    page: parsePositiveInt(query['page'], 1),
    limit: parsePositiveInt(query['limit'], 20),
  };
};
