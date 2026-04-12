import express from 'express';
import type { RequestHandler } from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { AccessorialControllers } from '../controllers/accessorialController';
import type { LoadControllers } from '../controllers/loadController';
import type { StopControllers } from '../controllers/stopController';
import {
  assignLoadValidator,
  createCheckCallValidator,
  createLoadValidator,
  listLoadsValidator,
  loadIdParamValidator,
  updateLoadValidator,
  transitionStatusValidator,
} from '../validators/loadValidators';
import {
  createAccessorialSchema,
  deleteAccessorialSchema,
  listAccessorialsSchema,
  updateAccessorialSchema,
} from '../validators/accessorialValidators';
import { updateApprovalSchema } from '../validators/accessorialApprovalValidator';
import {
  createStopSchema,
  deleteStopSchema,
  reorderStopsSchema,
  updateStopSchema,
} from '../validators/stopValidators';
import { rankDriversValidator } from '../validators/rankDriversValidator';

export interface LoadRouterControllers extends LoadControllers {
  transitionStatus: RequestHandler;
  getWeeklyGross: RequestHandler;
  rankDrivers: RequestHandler;
}

export const createLoadsRouter = (
  controllers: LoadRouterControllers,
  stopControllers: StopControllers,
  accessorialControllers: AccessorialControllers,
): express.Router => {
  const router = express.Router();

  router.post(
    '/',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(createLoadValidator),
    controllers.createLoad,
  );

  router.get('/', requireAuth, validateRequest(listLoadsValidator), controllers.listLoads);

  // Weekly gross tracker — must be before /:id to avoid param conflict
  router.get(
    '/weekly-gross',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    controllers.getWeeklyGross,
  );

  // Accessorial by-id routes — must be before /:id to avoid param conflict
  router.get(
    '/accessorials/:id',
    requireAuth,
    accessorialControllers.get,
  );

  router.patch(
    '/accessorials/:id',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(updateAccessorialSchema),
    accessorialControllers.update,
  );

  router.delete(
    '/accessorials/:id',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(deleteAccessorialSchema),
    accessorialControllers.remove,
  );

  router.patch(
    '/accessorials/:id/approval',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(updateApprovalSchema),
    accessorialControllers.updateApproval,
  );

  router.get('/:id', requireAuth, validateRequest(loadIdParamValidator), controllers.getLoadById);

  router.patch(
    '/:id/assignment',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(assignLoadValidator),
    controllers.assignLoad,
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

  router.get(
    '/:loadId/eligible-drivers',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(rankDriversValidator),
    controllers.rankDrivers,
  );

  // --- Stop sub-routes ---

  router.post(
    '/:loadId/stops',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(createStopSchema),
    stopControllers.create,
  );

  router.get(
    '/:loadId/stops',
    requireAuth,
    stopControllers.list,
  );

  // Reorder must be before /:loadId/stops/:stopId to avoid 'reorder' matching :stopId
  router.patch(
    '/:loadId/stops/reorder',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(reorderStopsSchema),
    stopControllers.reorder,
  );

  router.patch(
    '/:loadId/stops/:stopId',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(updateStopSchema),
    stopControllers.update,
  );

  router.delete(
    '/:loadId/stops/:stopId',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(deleteStopSchema),
    stopControllers.remove,
  );

  // --- Accessorial sub-routes ---

  router.post(
    '/:loadId/accessorials',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(createAccessorialSchema),
    accessorialControllers.create,
  );

  router.get(
    '/:loadId/accessorials',
    requireAuth,
    validateRequest(listAccessorialsSchema),
    accessorialControllers.list,
  );

  return router;
};
