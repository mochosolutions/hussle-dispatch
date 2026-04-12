import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { SettlementControllers } from '../controllers/settlementController';
import type { AdjustmentControllers } from '../controllers/adjustmentController';
import {
  generateSettlementValidator,
  listSettlementsValidator,
  settlementIdValidator,
  approveSettlementValidator,
  paySettlementValidator,
  disputeSettlementValidator,
  sendSettlementValidator,
  createAdjustmentValidator,
  updateAdjustmentValidator,
  deleteAdjustmentValidator,
} from '../validators/settlementValidators';

export interface SettlementModuleControllers {
  settlement: SettlementControllers;
  adjustment: AdjustmentControllers;
}

export const createSettlementRouter = (
  controllers: SettlementModuleControllers,
): Router => {
  const router = Router();

  // --- Settlement CRUD ---

  // POST /generate — create a new draft settlement
  router.post(
    '/generate',
    requireAuth,
    validateRequest(generateSettlementValidator),
    controllers.settlement.generate,
  );

  // GET / — list settlements with filters
  router.get(
    '/',
    requireAuth,
    validateRequest(listSettlementsValidator),
    controllers.settlement.list,
  );

  // GET /:id — settlement detail
  router.get(
    '/:id',
    requireAuth,
    validateRequest(settlementIdValidator),
    controllers.settlement.getById,
  );

  // PATCH /:id/approve — approve a draft settlement
  router.patch(
    '/:id/approve',
    requireAuth,
    validateRequest(approveSettlementValidator),
    controllers.settlement.approve,
  );

  // PATCH /:id/pay — mark settlement as paid
  router.patch(
    '/:id/pay',
    requireAuth,
    validateRequest(paySettlementValidator),
    controllers.settlement.pay,
  );

  // PATCH /:id/dispute — dispute a settlement
  router.patch(
    '/:id/dispute',
    requireAuth,
    validateRequest(disputeSettlementValidator),
    controllers.settlement.dispute,
  );

  // GET /:id/pdf — download settlement PDF
  router.get(
    '/:id/pdf',
    requireAuth,
    validateRequest(settlementIdValidator),
    controllers.settlement.downloadPdf,
  );

  // POST /:id/send — send settlement email
  router.post(
    '/:id/send',
    requireAuth,
    validateRequest(sendSettlementValidator),
    controllers.settlement.sendEmail,
  );

  // --- Adjustment sub-resource ---

  // POST /:id/adjustments — add adjustment line item
  router.post(
    '/:id/adjustments',
    requireAuth,
    validateRequest(createAdjustmentValidator),
    controllers.adjustment.addAdjustment,
  );

  // PATCH /:id/adjustments/:lineItemId — update adjustment
  router.patch(
    '/:id/adjustments/:lineItemId',
    requireAuth,
    validateRequest(updateAdjustmentValidator),
    controllers.adjustment.updateAdjustment,
  );

  // DELETE /:id/adjustments/:lineItemId — delete adjustment
  router.delete(
    '/:id/adjustments/:lineItemId',
    requireAuth,
    validateRequest(deleteAdjustmentValidator),
    controllers.adjustment.deleteAdjustment,
  );

  return router;
};
