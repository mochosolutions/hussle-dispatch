import express from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';
import { publicRateLimiter, uploadRateLimiter } from '@/shared/middleware/rateLimiter';
import type { DriverPortalControllers } from '../controllers/driverPortalController';
import {
  getDriverPortalLinkSchema,
  advanceStatusSchema,
  checkInSchema,
  presignDocumentSchema,
  confirmDocumentSchema,
} from '../validators/driverPortalValidators';
import {
  inviteDriverSchema,
  acceptDriverInviteSchema,
} from '../validators/driverAuthValidators';

interface DriverPortalRouteControllers {
  getDriverPortalLink: express.RequestHandler<{ loadId: string }>;
  inviteDriver: express.RequestHandler;
  acceptDriverInvite: express.RequestHandler;
  portal: DriverPortalControllers;
}

interface DriverPortalRouteMiddleware {
  authenticateDriverToken: express.RequestHandler;
  authenticateDriverSession: express.RequestHandler;
}

export const createDriverPortalRouter = (
  controllers: DriverPortalRouteControllers,
  middleware: DriverPortalRouteMiddleware,
): express.Router => {
  const router = express.Router();

  // --- Authenticated dispatcher endpoints ---
  router.get(
    '/loads/:loadId/driver-portal-link',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(getDriverPortalLinkSchema),
    controllers.getDriverPortalLink,
  );

  // Invite a driver (by driverId) to set up a first-class portal account.
  router.post(
    '/drivers/:driverId/invite',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(inviteDriverSchema),
    controllers.inviteDriver,
  );

  // --- Public driver invite acceptance (token in URL, creates the session) ---
  router.post(
    '/setup/:token',
    publicRateLimiter,
    validateRequest(acceptDriverInviteSchema),
    controllers.acceptDriverInvite,
  );

  // --- Driver portal endpoints (require a DRIVER session, not a bare token) ---
  const portalRouter = express.Router();
  portalRouter.use(publicRateLimiter);
  portalRouter.use(middleware.authenticateDriverSession);

  portalRouter.get('/loads', controllers.portal.listLoads);

  portalRouter.get('/load', controllers.portal.getLoadSummary);

  portalRouter.post(
    '/load/status',
    validateRequest(advanceStatusSchema),
    controllers.portal.advanceStatus,
  );

  portalRouter.post(
    '/load/check-in',
    validateRequest(checkInSchema),
    controllers.portal.checkIn,
  );

  portalRouter.post(
    '/load/documents/presign',
    uploadRateLimiter,
    validateRequest(presignDocumentSchema),
    controllers.portal.presignDocument,
  );

  portalRouter.post(
    '/load/documents/:id/confirm',
    validateRequest(confirmDocumentSchema),
    controllers.portal.confirmDocument,
  );

  router.use('/portal', portalRouter);

  return router;
};
