import express from 'express';
import { requireAuth } from '@/middleware/auth';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { DriverAvailabilityControllers } from '../controllers/driverAvailabilityController';
import type { DriverControllers } from '../controllers/driverController';
import {
  createOverrideValidator,
  deleteOverrideValidator,
  getWeeklyScheduleValidator,
  listOverridesValidator,
  setWeeklyScheduleValidator,
} from '../validators/driverAvailabilityValidators';
import { deadheadToValidator } from '../validators/deadheadToValidator';
import {
  createDriverValidator,
  driverIdParamValidator,
  driverLoadHistoryValidator,
  listDriversValidator,
  updateDriverValidator,
} from '../validators/driverValidators';

export interface DriverRouterControllers extends DriverControllers {
  availability: DriverAvailabilityControllers;
}

export const createDriversRouter = (controllers: DriverRouterControllers): express.Router => {
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
  router.get(
    '/:id/deadhead-to',
    requireAuth,
    validateRequest(deadheadToValidator),
    controllers.getDeadheadTo,
  );
  router.get(
    '/:id/loads',
    requireAuth,
    validateRequest(driverLoadHistoryValidator),
    controllers.getLoadHistory,
  );

  // --- Availability sub-routes ---

  router.put(
    '/:driverId/availability/weekly',
    requireAuth,
    validateRequest(setWeeklyScheduleValidator),
    controllers.availability.setWeeklySchedule,
  );

  router.get(
    '/:driverId/availability/weekly',
    requireAuth,
    validateRequest(getWeeklyScheduleValidator),
    controllers.availability.getWeeklySchedule,
  );

  router.post(
    '/:driverId/availability/overrides',
    requireAuth,
    validateRequest(createOverrideValidator),
    controllers.availability.createOverride,
  );

  router.get(
    '/:driverId/availability/overrides',
    requireAuth,
    validateRequest(listOverridesValidator),
    controllers.availability.listOverrides,
  );

  router.delete(
    '/:driverId/availability/overrides/:overrideId',
    requireAuth,
    validateRequest(deleteOverrideValidator),
    controllers.availability.deleteOverride,
  );

  return router;
};
