import express from 'express';
import type { RequestHandler } from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { StateMilesControllers } from '../controllers/stateMilesController';
import {
  getStateMilesValidator,
  iftaReportValidator,
  putStateMilesValidator,
} from '../validators/iftaValidators';

interface IftaRouterControllers {
  stateMilesControllers: StateMilesControllers;
  iftaReportController: RequestHandler;
}

export const createIftaRouter = (controllers: IftaRouterControllers): express.Router => {
  const router = express.Router();

  // IFTA Report
  router.get(
    '/report',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(iftaReportValidator),
    controllers.iftaReportController,
  );

  // Load State Miles
  router.put(
    '/loads/:loadId/state-miles',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(putStateMilesValidator),
    controllers.stateMilesControllers.putStateMiles,
  );

  router.get(
    '/loads/:loadId/state-miles',
    requireAuth,
    validateRequest(getStateMilesValidator),
    controllers.stateMilesControllers.getStateMiles,
  );

  return router;
};
