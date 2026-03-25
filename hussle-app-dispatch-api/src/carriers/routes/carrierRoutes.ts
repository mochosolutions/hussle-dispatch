import express from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { CarrierControllers } from '../controllers/carrierController';
import {
  carrierIdParamValidator,
  carrierNotesParamValidator,
  createCarrierNoteValidator,
  createCarrierValidator,
  listCarriersValidator,
  updateCarrierValidator,
} from '../validators/carrierValidators';

export const createCarriersRouter = (controllers: CarrierControllers): express.Router => {
  const router = express.Router();

  router.post(
    '/',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(createCarrierValidator),
    controllers.createCarrier,
  );
  router.post(
    '/with-assets',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(createCarrierValidator),
    controllers.createCarrierWithAssets,
  );
  router.get('/', requireAuth, validateRequest(listCarriersValidator), controllers.listCarriers);
  router.get(
    '/:id/stats',
    requireAuth,
    validateRequest(carrierIdParamValidator),
    controllers.getCarrierStats,
  );
  router.get(
    '/:id',
    requireAuth,
    validateRequest(carrierIdParamValidator),
    controllers.getCarrierById,
  );
  router.patch(
    '/:id',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(updateCarrierValidator),
    controllers.updateCarrier,
  );
  router.delete(
    '/:id',
    requireAuth,
    requireRole([ROLES.ADMIN]),
    validateRequest(carrierIdParamValidator),
    controllers.deleteCarrier,
  );
  router.get(
    '/:id/onboarding',
    requireAuth,
    validateRequest(carrierIdParamValidator),
    controllers.getCarrierOnboarding,
  );
  router.get(
    '/:carrierId/notes',
    requireAuth,
    validateRequest(carrierNotesParamValidator),
    controllers.listNotes,
  );
  router.post(
    '/:carrierId/notes',
    requireAuth,
    validateRequest(createCarrierNoteValidator),
    controllers.createNote,
  );

  return router;
};
