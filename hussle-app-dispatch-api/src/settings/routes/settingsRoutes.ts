import express from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { SettingsControllers } from '../controllers/settingsController';
import { updateSettingsSchema } from '../validators/settingsValidators';

export const createSettingsRouter = (controllers: SettingsControllers): express.Router => {
  const router = express.Router();

  router.get(
    '/',
    requireAuth,
    controllers.get,
  );

  router.put(
    '/',
    requireAuth,
    requireRole([ROLES.ADMIN]),
    validateRequest(updateSettingsSchema),
    controllers.update,
  );

  return router;
};
