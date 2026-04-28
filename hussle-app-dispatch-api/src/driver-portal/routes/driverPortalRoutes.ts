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

interface DriverPortalRouteControllers {
  getDriverPortalLink: express.RequestHandler<{ loadId: string }>;
  portal: DriverPortalControllers;
}

interface DriverPortalRouteMiddleware {
  authenticateDriverToken: express.RequestHandler;
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

  // --- Public driver portal endpoints (token auth) ---
  const portalRouter = express.Router();
  portalRouter.use(publicRateLimiter);
  portalRouter.use(middleware.authenticateDriverToken);

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
