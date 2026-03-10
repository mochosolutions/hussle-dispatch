import express from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { PlaceControllers } from '../controllers/placeController';
import {
  createPlaceValidator,
  listPlacesValidator,
  loadsAtFacilityValidator,
  placeIdParamValidator,
  typeaheadValidator,
  updatePlaceValidator,
} from '../validators/placeValidators';

export const createPlacesRouter = (controllers: PlaceControllers): express.Router => {
  const router = express.Router();

  router.post(
    '/',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(createPlaceValidator),
    controllers.createPlace,
  );
  router.get('/', requireAuth, validateRequest(listPlacesValidator), controllers.listPlaces);
  router.get(
    '/typeahead',
    requireAuth,
    validateRequest(typeaheadValidator),
    controllers.typeahead,
  );
  router.get(
    '/:id',
    requireAuth,
    validateRequest(placeIdParamValidator),
    controllers.getPlaceById,
  );
  router.get(
    '/:id/loads',
    requireAuth,
    validateRequest(loadsAtFacilityValidator),
    controllers.loadsAtFacility,
  );
  router.patch(
    '/:id',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(updatePlaceValidator),
    controllers.updatePlace,
  );
  router.delete(
    '/:id',
    requireAuth,
    requireRole([ROLES.ADMIN]),
    validateRequest(placeIdParamValidator),
    controllers.deletePlace,
  );

  return router;
};
