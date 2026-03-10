import express from 'express';
import type { RequestHandler } from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { LoadControllers } from '../controllers/loadController';
import {
  createCheckCallValidator,
  createLoadValidator,
  listLoadsValidator,
  loadIdParamValidator,
  updateLoadValidator,
  transitionStatusValidator,
} from '../validators/loadValidators';

export interface LoadRouterControllers extends LoadControllers {
  transitionStatus: RequestHandler;
  getWeeklyGross: RequestHandler;
}

export const createLoadsRouter = (controllers: LoadRouterControllers): express.Router => {
  const router = express.Router();

  router.post(
    '/',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(createLoadValidator),
    controllers.createLoad,
  );

  router.get(
    '/',
    requireAuth,
    validateRequest(listLoadsValidator),
    controllers.listLoads,
  );

  // Weekly gross tracker — must be before /:id to avoid param conflict
  router.get(
    '/weekly-gross',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    controllers.getWeeklyGross,
  );

  router.get(
    '/:id',
    requireAuth,
    validateRequest(loadIdParamValidator),
    controllers.getLoadById,
  );

  router.patch(
    '/:id/status',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(transitionStatusValidator),
    controllers.transitionStatus,
  );

  router.patch(
    '/:id',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(updateLoadValidator),
    controllers.updateLoad,
  );

  router.delete(
    '/:id',
    requireAuth,
    requireRole([ROLES.ADMIN]),
    validateRequest(loadIdParamValidator),
    controllers.deleteLoad,
  );

  router.post(
    '/:id/check-calls',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(createCheckCallValidator),
    controllers.createCheckCall,
  );

  router.get(
    '/:id/check-calls',
    requireAuth,
    validateRequest(loadIdParamValidator),
    controllers.listCheckCalls,
  );

  router.get(
    '/:id/status-history',
    requireAuth,
    validateRequest(loadIdParamValidator),
    controllers.listStatusHistory,
  );

  router.get(
    '/:id/documents',
    requireAuth,
    validateRequest(loadIdParamValidator),
    controllers.listLoadDocuments,
  );

  return router;
};
