import type { Request, RequestHandler, Response } from 'express';

import type { StorageProvider } from '@/shared/storage';
import type { Logger } from '@/shared/utils/logger';

import type { CreateManualAgreementInput } from '../services/createManualAgreement';
import type { AgreementServiceResult } from '../types/agreementServiceResult';
import type { Agreement } from '../types/agreementTypes';
import { createManualAgreementMapper } from './mappers/createManualAgreementMapper';
import { agreementTransformer } from './transformers/agreementTransformer';

export interface CreateManualAgreementControllerDeps {
  createManualAgreement: (
    input: CreateManualAgreementInput,
  ) => Promise<AgreementServiceResult<Agreement>>;
  storage: StorageProvider;
  logger: Logger;
}

/**
 * POST /api/v1/agreements/manual — admin uploads a signed-elsewhere agreement
 * PDF and persists it as a SIGNED Agreement row (providerName='MANUAL').
 * No events are dispatched (see createManualAgreement service comment).
 */
export const createManualAgreementController = (
  deps: CreateManualAgreementControllerDeps,
): RequestHandler => async (req: Request, res: Response): Promise<void> => {
  const input = createManualAgreementMapper(req);
  const result = await deps.createManualAgreement(input);
  const data = await agreementTransformer(result.data, { storage: deps.storage });
  res.status(201).json({ data });
};
