import { Router } from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { InvoiceModuleControllers } from '../compositionRoot';
import {
  listInvoicesValidator,
  invoiceIdParamValidator,
  updateInvoiceValidator,
  sendInvoiceValidator,
  markPaidValidator,
} from '../validators/invoiceValidators';
import {
  createFromLoadValidator,
  voidInvoiceValidator,
} from '../validators/createFromLoadValidator';

export const createInvoiceRouter = (controllers: InvoiceModuleControllers): Router => {
  const router = Router();

  // --- Invoice CRUD ---

  // GET /counts — draft count (must be before /:id)
  router.get(
    '/counts',
    requireAuth,
    controllers.invoice.getCounts,
  );

  // GET / — list with filters
  router.get(
    '/',
    requireAuth,
    validateRequest(listInvoicesValidator),
    controllers.invoice.listInvoices,
  );

  // POST /from-load/:loadId — create invoice from load
  router.post(
    '/from-load/:loadId',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(createFromLoadValidator),
    controllers.builder.createFromLoad,
  );

  // GET /:id — detail
  router.get(
    '/:id',
    requireAuth,
    validateRequest(invoiceIdParamValidator),
    controllers.invoice.getInvoiceById,
  );

  // PATCH /:id — edit draft
  router.patch(
    '/:id',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(updateInvoiceValidator),
    controllers.invoice.updateInvoice,
  );

  // DELETE /:id — ADMIN only, revert load to DELIVERED
  router.delete(
    '/:id',
    requireAuth,
    requireRole([ROLES.ADMIN]),
    validateRequest(invoiceIdParamValidator),
    controllers.invoice.deleteInvoice,
  );

  // POST /:id/approve — ADMIN only, DRAFT → APPROVED
  router.post(
    '/:id/approve',
    requireAuth,
    requireRole([ROLES.ADMIN]),
    validateRequest(invoiceIdParamValidator),
    controllers.invoice.approveInvoice,
  );

  // POST /:id/send — send invoice
  router.post(
    '/:id/send',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(sendInvoiceValidator),
    controllers.invoice.sendInvoice,
  );

  // POST /:id/mark-paid — record payment
  router.post(
    '/:id/mark-paid',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(markPaidValidator),
    controllers.invoice.markPaid,
  );

  // POST /:id/void — void invoice
  router.post(
    '/:id/void',
    requireAuth,
    requireRole([ROLES.ADMIN]),
    validateRequest(voidInvoiceValidator),
    controllers.builder.voidInvoice,
  );

  // --- PDF endpoints ---

  // GET /:id/pdf — generate + store + return URL
  router.get(
    '/:id/pdf',
    requireAuth,
    validateRequest(invoiceIdParamValidator),
    controllers.pdf.generatePdf,
  );

  // GET /:id/preview — stream raw PDF
  router.get(
    '/:id/preview',
    requireAuth,
    validateRequest(invoiceIdParamValidator),
    controllers.pdf.previewPdf,
  );

  // --- Document packet ---

  // GET /:id/packet — download ZIP
  router.get(
    '/:id/packet',
    requireAuth,
    validateRequest(invoiceIdParamValidator),
    controllers.packet.downloadPacket,
  );

  return router;
};
