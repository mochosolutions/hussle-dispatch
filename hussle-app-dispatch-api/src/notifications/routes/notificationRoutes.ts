import express from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';
import { publicRateLimiter } from '@/shared/middleware/rateLimiter';
import type { NotificationSettingsControllers } from '../controllers/notificationSettingsController';
import type { LoadNotificationControllers } from '../controllers/loadNotificationController';
import type { TrackingControllers } from '../controllers/trackingController';
import {
  customerIdParamSchema,
  loadIdParamSchema,
  trackingTokenParamSchema,
  upsertSettingsSchema,
  bulkUpsertSettingsSchema,
  upsertOverrideSchema,
  bulkUpsertOverridesSchema,
  createTokenSchema,
} from '../validators/notificationValidators';

export interface NotificationRouterControllers {
  settings: NotificationSettingsControllers;
  loadNotification: LoadNotificationControllers;
  tracking: TrackingControllers;
}

export const createNotificationRouter = (
  controllers: NotificationRouterControllers,
): express.Router => {
  const router = express.Router();

  // --- Customer notification settings ---

  router.get(
    '/customers/:customerId/settings',
    requireAuth,
    validateRequest(customerIdParamSchema),
    controllers.settings.getByCustomerId,
  );

  router.put(
    '/customers/:customerId/settings',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(upsertSettingsSchema),
    controllers.settings.upsert,
  );

  router.put(
    '/customers/:customerId/settings/bulk',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(bulkUpsertSettingsSchema),
    controllers.settings.bulkUpsert,
  );

  // --- Load notification overrides ---

  router.get(
    '/loads/:loadId/overrides',
    requireAuth,
    validateRequest(loadIdParamSchema),
    controllers.loadNotification.getOverrides,
  );

  router.put(
    '/loads/:loadId/overrides',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(upsertOverrideSchema),
    controllers.loadNotification.upsertOverride,
  );

  router.put(
    '/loads/:loadId/overrides/bulk',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(bulkUpsertOverridesSchema),
    controllers.loadNotification.bulkUpsertOverrides,
  );

  // --- Load notification history ---

  router.get(
    '/loads/:loadId/history',
    requireAuth,
    validateRequest(loadIdParamSchema),
    controllers.loadNotification.getHistory,
  );

  // --- Tracking tokens ---

  router.post(
    '/loads/:loadId/tracking-token',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(createTokenSchema),
    controllers.tracking.createToken,
  );

  // --- Public tracking endpoint (no auth, rate limited) ---

  router.get(
    '/tracking/:token',
    publicRateLimiter,
    validateRequest(trackingTokenParamSchema),
    controllers.tracking.getTrackingSummary,
  );

  return router;
};
