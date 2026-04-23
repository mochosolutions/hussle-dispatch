import Decimal from 'decimal.js';
import type { Logger } from '../../shared/utils/logger';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../shared/errors';
import { ROLES } from '../../config/roles';
import type {
  InvoiceRepoPort,
  InvoiceLoadQueryPort,
} from '../types/invoiceTypes';
import type {
  InvoiceService,
  ListInvoicesServiceInput,
  GetInvoiceByIdServiceInput,
  UpdateInvoiceServiceInput,
  DeleteInvoiceServiceInput,
  ApproveInvoiceServiceInput,
  SendInvoiceServiceInput,
  MarkPaidServiceInput,
} from '../types/invoiceServiceTypes';

interface InvoiceEmailPort {
  sendInvoiceEmail(input: {
    invoiceId: string;
    organizationId: string;
    recipientEmail: string;
    ccEmails?: string[];
    replyToEmail?: string;
    fromEmail: string;
    subject: string;
  }): Promise<void>;
}

interface InvoiceServiceDeps {
  invoiceRepo: InvoiceRepoPort;
  loadQuery: InvoiceLoadQueryPort;
  invoiceEmailService: InvoiceEmailPort;
  logger: Logger;
}

export const createInvoiceService = (deps: InvoiceServiceDeps): InvoiceService => ({
  listInvoices: async ({ organizationId, filters }) =>
    deps.invoiceRepo.findAll(organizationId, filters),

  getInvoiceById: async ({ id, organizationId }) => {
    const invoice = await deps.invoiceRepo.findById(id, organizationId);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    return invoice;
  },

  updateInvoice: async ({ id, organizationId, input }) => {
    const invoice = await deps.invoiceRepo.findById(id, organizationId);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new ValidationError('Only DRAFT invoices can be edited');
    }

    return deps.invoiceRepo.update(id, organizationId, input);
  },

  deleteInvoice: async ({ id, organizationId, role }) => {
    if (role !== ROLES.ADMIN) {
      throw new ForbiddenError('Only ADMIN can delete invoices');
    }

    const invoice = await deps.invoiceRepo.findById(id, organizationId);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new ValidationError('Only DRAFT invoices can be deleted');
    }

    await deps.invoiceRepo.delete(id, organizationId);

    // Revert load to DELIVERED
    await deps.loadQuery.updateLoadStatus(invoice.loadId, 'DELIVERED');

    deps.logger.info('Invoice deleted, load reverted to DELIVERED', {
      invoiceId: id,
      loadId: invoice.loadId,
    });
  },

  approveInvoice: async ({ id, organizationId, role, userId }) => {
    if (role !== ROLES.ADMIN) {
      throw new ForbiddenError('Only ADMIN can approve invoices');
    }

    const invoice = await deps.invoiceRepo.findById(id, organizationId);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new ValidationError('Only DRAFT invoices can be approved');
    }

    const updated = await deps.invoiceRepo.updateStatus(id, organizationId, 'APPROVED', {
      approvedByUserId: userId,
      approvedAt: new Date(),
    });

    deps.logger.info('Invoice approved', { invoiceId: id, userId });

    return updated;
  },

  sendInvoice: async ({ id, organizationId, email, ccEmails }) => {
    const invoice = await deps.invoiceRepo.findById(id, organizationId);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status !== 'APPROVED') {
      throw new ValidationError('Only APPROVED invoices can be sent');
    }

    // Send invoice email with PDF + load document attachments
    await deps.invoiceEmailService.sendInvoiceEmail({
      invoiceId: id,
      organizationId,
      recipientEmail: email,
      ccEmails,
      fromEmail: 'invoices@fleetcommand.app',
      subject: `Invoice from ${invoice.carrier?.name ?? 'Carrier'} — Load #${invoice.load.loadNumber}`,
    });

    // Status update happens inside invoiceEmailService, re-fetch
    const updated = await deps.invoiceRepo.findById(id, organizationId);

    if (updated === null) {
      throw new NotFoundError('Invoice not found after send');
    }

    deps.logger.info('Invoice sent with PDF + attachments', { invoiceId: id, email });

    return updated;
  },

  getDraftCount: async (organizationId: string): Promise<number> =>
    deps.invoiceRepo.countByStatus(organizationId, 'DRAFT'),

  markPaid: async ({ id, organizationId, amount, method, reference, date }) => {
    const invoice = await deps.invoiceRepo.findById(id, organizationId);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    const validStatuses = ['SENT', 'APPROVED', 'PARTIALLY_PAID'];

    if (!validStatuses.includes(invoice.status)) {
      throw new ValidationError(
        `Cannot mark as paid. Invoice status must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const totalAmount = new Decimal(String(invoice.totalAmount));
    const paidAmount = new Decimal(amount);
    const previouslyPaid = invoice.paidAmount !== null
      ? new Decimal(String(invoice.paidAmount))
      : new Decimal(0);
    const cumulativePaid = previouslyPaid.add(paidAmount);

    const isFullPayment = cumulativePaid.gte(totalAmount);
    const newStatus = isFullPayment ? 'PAID' : 'PARTIALLY_PAID';

    const updated = await deps.invoiceRepo.updateStatus(id, organizationId, newStatus, {
      paidAmount: cumulativePaid.toNumber(),
      paymentMethod: method,
      paymentReference: reference,
      paidAt: new Date(date),
    });

    // If fully paid, transition load to PAID
    if (isFullPayment) {
      await deps.loadQuery.updateLoadStatus(invoice.loadId, 'PAID');
      deps.logger.info('Invoice fully paid, load transitioned to PAID', {
        invoiceId: id,
        loadId: invoice.loadId,
      });
    }

    deps.logger.info('Invoice payment recorded', {
      invoiceId: id,
      amount: paidAmount.toFixed(2),
      status: newStatus,
    });

    return updated;
  },
});
