import express from 'express';
import { requireAuth } from '@/middleware/auth';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { CarrierControllers } from '../controllers/carrierController';
import {
  carrierIdParamValidator,
  createCarrierValidator,
  listCarriersValidator,
  updateCarrierValidator,
} from '../validators/carrierValidators';

export const createCarriersRouter = (controllers: CarrierControllers): express.Router => {
  const router = express.Router();

  router.post('/', requireAuth, validateRequest(createCarrierValidator), controllers.createCarrier);
  router.get('/', requireAuth, validateRequest(listCarriersValidator), controllers.listCarriers);
  router.get(
    '/:id',
    requireAuth,
    validateRequest(carrierIdParamValidator),
    controllers.getCarrierById,
  );
  router.patch(
    '/:id',
    requireAuth,
    validateRequest(updateCarrierValidator),
    controllers.updateCarrier,
  );
  router.delete(
    '/:id',
    requireAuth,
    validateRequest(carrierIdParamValidator),
    controllers.deleteCarrier,
  );
  router.get(
    '/:id/onboarding',
    requireAuth,
    validateRequest(carrierIdParamValidator),
    controllers.getCarrierOnboarding,
  );

  return router;
};
