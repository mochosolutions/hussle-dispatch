import express from 'express';
import { requireAuth } from '@/middleware/auth';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { DriverControllers } from '../controllers/driverController';
import {
  createDriverValidator,
  driverIdParamValidator,
  listDriversValidator,
  updateDriverValidator,
} from '../validators/driverValidators';

export const createDriversRouter = (controllers: DriverControllers): express.Router => {
  const router = express.Router();

  router.post('/', requireAuth, validateRequest(createDriverValidator), controllers.createDriver);
  router.get('/', requireAuth, validateRequest(listDriversValidator), controllers.listDrivers);
  router.get(
    '/:id',
    requireAuth,
    validateRequest(driverIdParamValidator),
    controllers.getDriverById,
  );
  router.patch(
    '/:id',
    requireAuth,
    validateRequest(updateDriverValidator),
    controllers.updateDriver,
  );
  router.delete(
    '/:id',
    requireAuth,
    validateRequest(driverIdParamValidator),
    controllers.deleteDriver,
  );

  return router;
};
