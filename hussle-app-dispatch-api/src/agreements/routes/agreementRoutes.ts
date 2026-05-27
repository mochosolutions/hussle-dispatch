import express from 'express';

import { ROLES } from '@/config/roles';
import { requireAuth, requireRole } from '@/middleware/auth';
import { validateRequest } from '@/shared/middleware/validateRequest';

import {
  agreementIdParamValidator,
  voidAgreementValidator,
} from '../validators/agreementIdParamValidator';
import { createManualAgreementValidator } from '../validators/createManualAgreementValidator';
import { listAgreementsValidator } from '../validators/listAgreementsValidator';
import { requestAgreementValidator } from '../validators/requestAgreementValidator';

export interface AgreementControllers {
  request: express.RequestHandler;
  createManual: express.RequestHandler;
  list: express.RequestHandler;
  get: express.RequestHandler;
  void: express.RequestHandler;
  download: express.RequestHandler;
}

/**
 * /api/v1/agreements router. Top-level mount + composition wiring is the
 * responsibility of US-14.
 */
export const createAgreementsRouter = (
  controllers: AgreementControllers,
): express.Router => {
  const router = express.Router();

  router.post(
    '/',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(requestAgreementValidator),
    controllers.request,
  );

  // POST /api/v1/agreements/manual — admin uploads an externally-signed PDF
  // and persists a SIGNED Agreement row (providerName='MANUAL'). Mounted
  // BEFORE /:id so the `manual` literal doesn't get captured as an id.
  router.post(
    '/manual',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(createManualAgreementValidator),
    controllers.createManual,
  );

  router.get(
    '/',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(listAgreementsValidator),
    controllers.list,
  );

  // GET /api/v1/agreements/:id/download?artifact=signed|audit — auth +
  // org-scoped redirect to a short-lived download URL for the persisted
  // artifact. Mounted before /:id so the param + suffix combo resolves
  // correctly.
  router.get(
    '/:id/download',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(agreementIdParamValidator),
    controllers.download,
  );

  router.get(
    '/:id',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(agreementIdParamValidator),
    controllers.get,
  );

  router.post(
    '/:id/void',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(voidAgreementValidator),
    controllers.void,
  );

  return router;
};
