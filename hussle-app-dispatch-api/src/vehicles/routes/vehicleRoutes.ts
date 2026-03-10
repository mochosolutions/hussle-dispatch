import express from 'express';
import { requireAuth } from '@/middleware/auth';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { VehicleControllers } from '../controllers/vehicleController';
import {
  assignDriverValidator,
  createVehicleValidator,
  listVehiclesValidator,
  loadHistoryValidator,
  updateVehicleValidator,
  vehicleIdParamValidator,
} from '../validators/vehicleValidators';

export const createVehiclesRouter = (controllers: VehicleControllers): express.Router => {
  const router = express.Router();

  router.post('/', requireAuth, validateRequest(createVehicleValidator), controllers.createVehicle);
  router.get('/', requireAuth, validateRequest(listVehiclesValidator), controllers.listVehicles);
  router.get(
    '/:id',
    requireAuth,
    validateRequest(vehicleIdParamValidator),
    controllers.getVehicleById,
  );
  router.patch(
    '/:id',
    requireAuth,
    validateRequest(updateVehicleValidator),
    controllers.updateVehicle,
  );
  router.delete(
    '/:id',
    requireAuth,
    validateRequest(vehicleIdParamValidator),
    controllers.deleteVehicle,
  );
  router.patch(
    '/:id/assign-driver',
    requireAuth,
    validateRequest(assignDriverValidator),
    controllers.assignDriver,
  );
  router.patch(
    '/:id/unassign-driver',
    requireAuth,
    validateRequest(vehicleIdParamValidator),
    controllers.unassignDriver,
  );
  router.get(
    '/:id/loads',
    requireAuth,
    validateRequest(loadHistoryValidator),
    controllers.getLoadHistory,
  );

  return router;
};
