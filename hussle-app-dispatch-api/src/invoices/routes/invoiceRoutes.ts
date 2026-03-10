import { Router } from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { InvoiceControllers } from '../controllers/invoiceController';
import {
  listInvoicesValidator,
  invoiceIdParamValidator,
  updateInvoiceValidator,
  sendInvoiceValidator,
  markPaidValidator,
} from '../validators/invoiceValidators';

export const createInvoiceRouter = (controllers: InvoiceControllers): Router => {
  const router = Router();

  // GET / — list with filters
  router.get(
    '/',
    requireAuth,
    validateRequest(listInvoicesValidator),
    controllers.listInvoices,
  );

  // GET /:id — detail
  router.get(
    '/:id',
    requireAuth,
    validateRequest(invoiceIdParamValidator),
    controllers.getInvoiceById,
  );

  // PATCH /:id — edit draft
  router.patch(
    '/:id',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(updateInvoiceValidator),
    controllers.updateInvoice,
  );

  // DELETE /:id — ADMIN only, revert load to DELIVERED
  router.delete(
    '/:id',
    requireAuth,
    requireRole([ROLES.ADMIN]),
    validateRequest(invoiceIdParamValidator),
    controllers.deleteInvoice,
  );

  // POST /:id/approve — ADMIN only, DRAFT → APPROVED
  router.post(
    '/:id/approve',
    requireAuth,
    requireRole([ROLES.ADMIN]),
    validateRequest(invoiceIdParamValidator),
    controllers.approveInvoice,
  );

  // POST /:id/send — send invoice
  router.post(
    '/:id/send',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(sendInvoiceValidator),
    controllers.sendInvoice,
  );

  // POST /:id/mark-paid — record payment
  router.post(
    '/:id/mark-paid',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(markPaidValidator),
    controllers.markPaid,
  );

  return router;
};
