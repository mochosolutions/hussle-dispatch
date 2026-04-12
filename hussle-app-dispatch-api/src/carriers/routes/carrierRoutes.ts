import express from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { ApprovalControllers } from '../controllers/approvalController';
import type { CarrierControllers } from '../controllers/carrierController';
import type { InviteControllers } from '../controllers/inviteController';
import type { OnboardingDetailControllers } from '../controllers/onboardingDetailController';
import {
  carrierIdParamValidator,
  carrierNotesParamValidator,
  createCarrierNoteValidator,
  createCarrierValidator,
  listCarriersValidator,
  sendInviteValidator,
  updateCarrierValidator,
} from '../validators/carrierValidators';
import {
  approveCarrierValidator,
  rejectCarrierValidator,
} from '../validators/approvalValidators';

export const createCarriersRouter = (
  controllers: CarrierControllers & InviteControllers & ApprovalControllers & OnboardingDetailControllers,
): express.Router => {
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
  router.post(
    '/:id/invite',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(sendInviteValidator),
    controllers.sendInvite,
  );
  router.post(
    '/:id/resend-invite',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(sendInviteValidator),
    controllers.resendInvite,
  );
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
    controllers.getOnboardingDetail,
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
  router.post(
    '/:id/approve',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(approveCarrierValidator),
    controllers.approve,
  );
  router.post(
    '/:id/reject',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(rejectCarrierValidator),
    controllers.reject,
  );

  return router;
};
