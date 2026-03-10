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

interface NotificationPort {
  sendEmail(params: {
    to: string;
    from: string;
    subject: string;
    html: string;
    attachments?: { filename: string; content: string }[];
  }): Promise<void>;
}

interface InvoiceServiceDeps {
  invoiceRepo: InvoiceRepoPort;
  loadQuery: InvoiceLoadQueryPort;
  notificationService: NotificationPort;
  logger: Logger;
}

export const createInvoiceService = (deps: InvoiceServiceDeps): InvoiceService => ({
  listInvoices: async ({ organizationId, filters }) =>
    deps.invoiceRepo.findAll(organizationId, filters),

  getInvoiceById: async ({ id }) => {
    const invoice = await deps.invoiceRepo.findById(id);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    return invoice;
  },

  updateInvoice: async ({ id, input }) => {
    const invoice = await deps.invoiceRepo.findById(id);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new ValidationError('Only DRAFT invoices can be edited');
    }

    return deps.invoiceRepo.update(id, input);
  },

  deleteInvoice: async ({ id, role }) => {
    if (role !== ROLES.ADMIN) {
      throw new ForbiddenError('Only ADMIN can delete invoices');
    }

    const invoice = await deps.invoiceRepo.findById(id);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new ValidationError('Only DRAFT invoices can be deleted');
    }

    await deps.invoiceRepo.delete(id);

    // Revert load to DELIVERED
    await deps.loadQuery.updateLoadStatus(invoice.loadId, 'DELIVERED');

    deps.logger.info('Invoice deleted, load reverted to DELIVERED', {
      invoiceId: id,
      loadId: invoice.loadId,
    });
  },

  approveInvoice: async ({ id, role, userId }) => {
    if (role !== ROLES.ADMIN) {
      throw new ForbiddenError('Only ADMIN can approve invoices');
    }

    const invoice = await deps.invoiceRepo.findById(id);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new ValidationError('Only DRAFT invoices can be approved');
    }

    const updated = await deps.invoiceRepo.updateStatus(id, 'APPROVED', {
      approvedByUserId: userId,
      approvedAt: new Date(),
    });

    deps.logger.info('Invoice approved', { invoiceId: id, userId });

    return updated;
  },

  sendInvoice: async ({ id, email }) => {
    const invoice = await deps.invoiceRepo.findById(id);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status !== 'APPROVED') {
      throw new ValidationError('Only APPROVED invoices can be sent');
    }

    // Send notification (logging in dev)
    await deps.notificationService.sendEmail({
      to: email,
      from: 'invoices@dispatch.app',
      subject: `Invoice ${invoice.invoiceNumber}`,
      html: `<p>Please find attached invoice ${invoice.invoiceNumber} for load ${invoice.load.loadNumber}.</p>`,
    });

    const updated = await deps.invoiceRepo.updateStatus(id, 'SENT', {
      sentAt: new Date(),
      sentTo: email,
    });

    deps.logger.info('Invoice sent', { invoiceId: id, email });

    return updated;
  },

  markPaid: async ({ id, amount, method, reference, date }) => {
    const invoice = await deps.invoiceRepo.findById(id);

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

    const updated = await deps.invoiceRepo.updateStatus(id, newStatus, {
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
