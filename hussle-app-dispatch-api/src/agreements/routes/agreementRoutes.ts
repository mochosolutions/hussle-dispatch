import express from 'express';

import { ROLES } from '@/config/roles';
import { requireAuth, requireRole } from '@/middleware/auth';
import { validateRequest } from '@/shared/middleware/validateRequest';

import {
  agreementIdParamValidator,
  voidAgreementValidator,
} from '../validators/agreementIdParamValidator';
import { listAgreementsValidator } from '../validators/listAgreementsValidator';
import { requestAgreementValidator } from '../validators/requestAgreementValidator';

export interface AgreementControllers {
  request: express.RequestHandler;
  list: express.RequestHandler;
  get: express.RequestHandler;
  void: express.RequestHandler;
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

  router.get(
    '/',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(listAgreementsValidator),
    controllers.list,
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
