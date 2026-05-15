import type { Request, RequestHandler, Response } from 'express';

import type { StorageProvider } from '@/shared/storage';

import type { AgreementRepoPort } from '../types/agreementRepoPort';
import { listAgreementsMapper } from './mappers/listAgreementsMapper';
import { agreementTransformer } from './transformers/agreementTransformer';

export interface ListAgreementsControllerDeps {
  agreementRepo: AgreementRepoPort;
  storage: StorageProvider;
}

/**
 * GET /api/v1/agreements
 *
 * Org-scoped, paginated list. Pagination metadata is included alongside the
 * transformed items.
 */
export const listAgreementsController = (
  deps: ListAgreementsControllerDeps,
): RequestHandler => async (req: Request, res: Response): Promise<void> => {
  const filters = listAgreementsMapper(req);
  const { data, total } = await deps.agreementRepo.findManyByOrg(filters);

  const items = await Promise.all(
    data.map((agreement) => agreementTransformer(agreement, { storage: deps.storage })),
  );

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

  res.status(200).json({
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  });
};
