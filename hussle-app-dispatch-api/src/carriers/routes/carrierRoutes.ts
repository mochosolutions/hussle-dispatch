import express from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { ApprovalControllers } from '../controllers/approvalController';
import type { CarrierControllers } from '../controllers/carrierController';
import type { InviteControllers } from '../controllers/inviteController';
import type { OnboardingDetailControllers } from '../controllers/onboardingDetailController';
import type { DispatchOverrideControllers } from '../controllers/dispatchOverrideController';
import type { SuspendControllers } from '../controllers/suspendController';
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
import {
  adminActivateCarrierValidator,
  suspendCarrierValidator,
  unsuspendCarrierValidator,
} from '../validators/suspendValidators';
import { dispatchOverrideValidator } from '../validators/dispatchOverrideValidator';

export const createCarriersRouter = (
  controllers: CarrierControllers
    & InviteControllers
    & ApprovalControllers
    & OnboardingDetailControllers
    & DispatchOverrideControllers
    & SuspendControllers,
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
  router.get('/tab-counts', requireAuth, controllers.getCarrierTabCounts);
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
  router.post(
    '/:id/dispatch-override',
    requireAuth,
    requireRole([ROLES.ADMIN]),
    validateRequest(dispatchOverrideValidator),
    controllers.dispatchOverride,
  );
  router.post(
    '/:id/suspend',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(suspendCarrierValidator),
    controllers.suspend,
  );
  router.post(
    '/:id/unsuspend',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(unsuspendCarrierValidator),
    controllers.unsuspend,
  );
  router.post(
    '/:id/admin-activate',
    requireAuth,
    requireRole([ROLES.ADMIN]),
    validateRequest(adminActivateCarrierValidator),
    controllers.adminActivate,
  );

  return router;
};
