import type { Request, RequestHandler, Response } from 'express';

import type { EventBus } from '@/shared/messaging/eventBus';
import type { StorageProvider } from '@/shared/storage';
import type { Logger } from '@/shared/utils/logger';

import type {
  RequestAgreementInput,
} from '../services/requestAgreement';
import type { AgreementServiceResult } from '../types/agreementServiceResult';
import type { Agreement } from '../types/agreementTypes';
import type { OrganizationQueryPort } from '../queries/organizationQueries';
import { requestAgreementMapper } from './mappers/requestAgreementMapper';
import { agreementTransformer } from './transformers/agreementTransformer';

export interface RequestAgreementControllerDeps {
  requestAgreement: (input: RequestAgreementInput) => Promise<AgreementServiceResult<Agreement>>;
  orgQueries: OrganizationQueryPort;
  eventBus: EventBus;
  storage: StorageProvider;
  logger: Logger;
}

/**
 * POST /api/v1/agreements
 *
 * 1. Resolve org name from req.organizationId via the cross-module query port.
 * 2. Map request to RequestAgreementInput.
 * 3. Invoke the (pre-bound) requestAgreement service.
 * 4. Publish emitted events fire-and-forget.
 * 5. Transform the resulting Agreement and respond 201.
 */
export const requestAgreementController = (
  deps: RequestAgreementControllerDeps,
): RequestHandler => async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.organizationId ?? '';
  const orgName = await deps.orgQueries.findOrgNameById(organizationId);
  const input = requestAgreementMapper(req, orgName);
  const result = await deps.requestAgreement(input);

  result.events.forEach((event) => {
    deps.eventBus.publish(event.type, event.payload).catch((error: unknown) => {
      deps.logger.error('agreement event publish failed', {
        type: event.type,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  });

  const data = await agreementTransformer(result.data, { storage: deps.storage });
  res.status(201).json({ data });
};
