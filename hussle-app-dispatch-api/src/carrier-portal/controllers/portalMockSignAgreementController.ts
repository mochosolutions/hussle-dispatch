import type { Request, Response } from 'express';

import { agreementTransformer } from '@/agreements/controllers/transformers/agreementTransformer';
import type { Agreement } from '@/agreements/types/agreementTypes';
import { UnauthorizedError } from '@/shared/errors/commonErrors';
import type { StorageProvider } from '@/shared/storage';

export interface PortalMockSignAgreementInput {
  agreementId: string;
  carrierId: string;
}

export interface PortalMockSignAgreementControllerDeps {
  mockSignAgreement: (
    input: PortalMockSignAgreementInput,
  ) => Promise<{ data: Agreement }>;
  storage: StorageProvider;
}

const getCarrierId = (req: Request): string => {
  if (!req.carrierPortal) {
    throw new UnauthorizedError('Carrier portal context is required');
  }
  return req.carrierPortal.carrierId;
};

/**
 * POST /api/v1/carrier-portal/agreements/:id/mock-sign
 *
 * Dev-only — only mounted when env.SIGNATURE_PROVIDER === 'mock'. Flips the
 * agreement row to SIGNED via the mock provider's __testHelpers and returns
 * the transformed AgreementContext.
 */
export const createPortalMockSignAgreementController =
  (deps: PortalMockSignAgreementControllerDeps) =>
  async (req: Request, res: Response): Promise<void> => {
    const carrierId = getCarrierId(req);
    const result = await deps.mockSignAgreement({
      agreementId: req.params['id'] ?? '',
      carrierId,
    });
    const response = await agreementTransformer(result.data, { storage: deps.storage });
    res.status(200).json({ data: response });
  };
