import type { Request, Response } from 'express';
import { AgreementTemplateKey } from '@prisma/client';

import { UnauthorizedError } from '@/shared/errors/commonErrors';
import { BadRequestError } from '@mocho/common';
import type { StorageProvider } from '@/shared/storage';

import { agreementTransformer } from '@/agreements/controllers/transformers/agreementTransformer';
import type { PortalAgreementQueryPort } from '../types/portalAgreementQueryPort';

export interface PortalAgreementControllerDeps {
  agreementQueries: PortalAgreementQueryPort;
  storage: StorageProvider;
}

const getCarrierId = (req: Request): string => {
  if (!req.carrierPortal) {
    throw new UnauthorizedError('Carrier portal context is required');
  }
  return req.carrierPortal.carrierId;
};

const parseTemplateKey = (raw: unknown): AgreementTemplateKey => {
  if (raw === 'DISPATCH_AGREEMENT') {
    return AgreementTemplateKey.DISPATCH_AGREEMENT;
  }
  throw new BadRequestError('templateKey must be DISPATCH_AGREEMENT');
};

/**
 * GET /api/v1/carrier-portal/agreements
 *
 * Returns the most-recent agreement matching the carrier (from invite-token
 * context) + templateKey query, wrapped as a single-item list to match the
 * dispatcher endpoint shape: { data: [...], pagination: { ... } }.
 */
export const createPortalAgreementControllers = (deps: PortalAgreementControllerDeps) => ({
  getLatestForCarrier: async (req: Request, res: Response): Promise<void> => {
    const carrierId = getCarrierId(req);
    const templateKey = parseTemplateKey(req.query['templateKey']);

    const agreement = await deps.agreementQueries.findLatestForCarrier(carrierId, templateKey);

    const items = agreement === null
      ? []
      : [await agreementTransformer(agreement, { storage: deps.storage })];

    res.status(200).json({
      data: items,
      pagination: {
        page: 1,
        limit: 1,
        total: items.length,
        totalPages: items.length === 0 ? 0 : 1,
        hasMore: false,
      },
    });
  },
});
