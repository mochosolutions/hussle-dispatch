import type { Request, RequestHandler, Response } from 'express';

import type { EventBus } from '@/shared/messaging/eventBus';
import type { StorageProvider } from '@/shared/storage';
import type { Logger } from '@/shared/utils/logger';

import type { VoidAgreementInput } from '../services/voidAgreement';
import type { AgreementServiceResult } from '../types/agreementServiceResult';
import type { Agreement } from '../types/agreementTypes';
import { voidAgreementMapper } from './mappers/voidAgreementMapper';
import { agreementTransformer } from './transformers/agreementTransformer';

export interface VoidAgreementControllerDeps {
  voidAgreement: (input: VoidAgreementInput) => Promise<AgreementServiceResult<Agreement>>;
  eventBus: EventBus;
  storage: StorageProvider;
  logger: Logger;
}

/**
 * POST /api/v1/agreements/:id/void
 *
 * State machine + provider void are owned by the service. Controller maps the
 * request, dispatches emitted events fire-and-forget, and transforms the
 * voided agreement for the response.
 */
export const voidAgreementController = (
  deps: VoidAgreementControllerDeps,
): RequestHandler => async (req: Request, res: Response): Promise<void> => {
  const input = voidAgreementMapper(req);
  const result = await deps.voidAgreement(input);

  result.events.forEach((event) => {
    deps.eventBus.publish(event.type, event.payload).catch((error: unknown) => {
      deps.logger.error('agreement event publish failed', {
        type: event.type,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  });

  const data = await agreementTransformer(result.data, { storage: deps.storage });
  res.status(200).json({ data });
};
