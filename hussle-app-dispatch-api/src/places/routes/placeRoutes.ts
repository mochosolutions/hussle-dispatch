import express from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { PlaceModuleControllers } from '../compositionRoot';
import {
  createPlaceValidator,
  listPlacesValidator,
  loadsAtFacilityValidator,
  placeIdParamValidator,
  typeaheadValidator,
  updatePlaceValidator,
} from '../validators/placeValidators';
import { addressSearchValidator } from '../validators/addressSearchValidator';
import { routeDistanceValidator } from '../validators/routeDistanceValidator';
import { geocodingRateLimiter } from '@/shared/middleware/rateLimiter';

export const createPlacesRouter = (controllers: PlaceModuleControllers): express.Router => {
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
    '/address-search',
    requireAuth,
    geocodingRateLimiter,
    validateRequest(addressSearchValidator),
    controllers.addressSearch,
  );
  router.post(
    '/route-distance',
    requireAuth,
    geocodingRateLimiter,
    validateRequest(routeDistanceValidator),
    controllers.routeDistance,
  );
  router.get(
    '/:id/stats',
    requireAuth,
    validateRequest(placeIdParamValidator),
    controllers.getPlaceStats,
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
