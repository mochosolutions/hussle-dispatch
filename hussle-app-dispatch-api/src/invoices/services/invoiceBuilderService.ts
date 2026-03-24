import Decimal from 'decimal.js';
import type { Logger } from '../../shared/utils/logger';
import { generateSequenceNumber } from '../../shared/sequenceGenerator';
import type { InvoiceRepoPort, InvoiceLoadQueryPort, InvoiceWithRelations } from '../types/invoiceTypes';
import { NotFoundError, ValidationError } from '../../shared/errors';

interface InvoiceBuilderDeps {
  invoiceRepo: InvoiceRepoPort;
  loadQuery: InvoiceLoadQueryPort;
  logger: Logger;
}

export interface CreateFromLoadInput {
  loadId: string;
  organizationId: string;
  userId: string;
}

export interface VoidInvoiceInput {
  invoiceId: string;
  organizationId: string;
  userId: string;
}

export interface InvoiceBuilderService {
  createFromLoad(input: CreateFromLoadInput): Promise<InvoiceWithRelations>;
  voidInvoice(input: VoidInvoiceInput): Promise<InvoiceWithRelations>;
}

export const createInvoiceBuilderService = (
  deps: InvoiceBuilderDeps,
): InvoiceBuilderService => ({
  createFromLoad: async (input: CreateFromLoadInput): Promise<InvoiceWithRelations> => {
    const load = await deps.loadQuery.findLoadById(input.loadId);

    if (load === null) {
      throw new NotFoundError('Load not found');
    }

    // Must be DELIVERED or INVOICE_PENDING
    const validStatuses = ['DELIVERED', 'INVOICE_PENDING'];
    if (!validStatuses.includes(load.status)) {
      throw new ValidationError(
        `Load must be in DELIVERED or INVOICE_PENDING status. Current: ${load.status}`,
      );
    }

    // Check for existing non-void invoice
    const existing = await deps.invoiceRepo.findNonVoidByLoadId(input.loadId);
    if (existing !== null) {
      throw new ValidationError('A non-void invoice already exists for this load');
    }

    const carrierType = load.carrier?.type ?? 'COMPANY_ASSET';
    const customerRate = new Decimal(
      load.customerRate !== null && load.customerRate !== undefined
        ? String(load.customerRate)
        : '0',
    );
    const dispatchFee = new Decimal(
      load.dispatchFee !== null && load.dispatchFee !== undefined
        ? String(load.dispatchFee)
        : '0',
    );

    const accessorialsTotal = load.accessorialCharges.reduce(
      (sum, charge) => sum.add(new Decimal(String(charge.amount))),
      new Decimal(0),
    );

    const isCompanyAsset = carrierType === 'COMPANY_ASSET';
    const invoiceType = isCompanyAsset ? 'CUSTOMER' : 'DISPATCH_FEE';
    const subtotal = isCompanyAsset ? customerRate : dispatchFee;
    const totalAmount = isCompanyAsset ? subtotal.add(accessorialsTotal) : subtotal;

    const paymentTerms = load.customer?.paymentTerms ?? 'net_30';
    const paymentTermsDays = load.customer?.paymentTermsDays ?? 30;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);

    const missingSignedBol = load.bolSignedAt === null;
    const invoiceNumber = await generateSequenceNumber('INVOICE', load.organizationId);

    const invoice = await deps.invoiceRepo.create({
      loadId: load.id,
      carrierId: load.carrierId ?? undefined,
      customerId: load.customerId ?? undefined,
      invoiceNumber,
      type: invoiceType,
      subtotal: subtotal.toNumber(),
      accessorials: accessorialsTotal.toNumber(),
      totalAmount: totalAmount.toNumber(),
      paymentTerms,
      paymentTermsDays,
      dueDate,
      missingSignedBol,
    });

    // Transition load to INVOICE_PENDING
    await deps.loadQuery.updateLoadStatus(load.id, 'INVOICE_PENDING');

    deps.logger.info('Invoice created from builder', {
      invoiceId: invoice.id,
      invoiceNumber,
      loadId: load.id,
      type: invoiceType,
    });

    return invoice;
  },

  voidInvoice: async (input: VoidInvoiceInput): Promise<InvoiceWithRelations> => {
    const invoice = await deps.invoiceRepo.findById(input.invoiceId);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    const voidableStatuses = ['DRAFT', 'APPROVED'];
    if (!voidableStatuses.includes(invoice.status)) {
      throw new ValidationError(
        `Only DRAFT or APPROVED invoices can be voided. Current: ${invoice.status}`,
      );
    }

    const updated = await deps.invoiceRepo.updateStatus(invoice.id, 'VOID');

    // Revert load to DELIVERED
    await deps.loadQuery.updateLoadStatus(invoice.loadId, 'DELIVERED');

    deps.logger.info('Invoice voided', {
      invoiceId: invoice.id,
      loadId: invoice.loadId,
    });

    return updated;
  },
});
