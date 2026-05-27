import Decimal from 'decimal.js';
import { Prisma } from '@prisma/client';
import type { Logger } from '../../shared/utils/logger';
import type { EventBus } from '../../shared/messaging/eventBus';
import { generateSequenceNumber } from '../../shared/sequenceGenerator';
import type { InvoiceRepoPort, InvoiceLoadQueryPort, InvoiceWithRelations } from '../types/invoiceTypes';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { resolveDispatchFee, computeDispatchFeeAmount } from '../../shared/utils/resolveDispatchFee';
import { isBilledToCustomer } from '../../shared/utils/accessorialBillTo';

interface InvoiceBuilderDeps {
  invoiceRepo: InvoiceRepoPort;
  loadQuery: InvoiceLoadQueryPort;
  eventBus: EventBus;
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

export interface CreateFromLoadResult {
  invoice: InvoiceWithRelations;
  // Resolved dispatch fee amount in dollars, for EXTERNAL_CARRIER follow-up
  // DISPATCH_FEE invoice. Null when carrier is not EXTERNAL_CARRIER.
  dispatchFeeAmount: Decimal | null;
}

export interface InvoiceBuilderService {
  createFromLoad(input: CreateFromLoadInput): Promise<InvoiceWithRelations>;
  createFromLoadWithFee(input: CreateFromLoadInput): Promise<CreateFromLoadResult>;
  voidInvoice(input: VoidInvoiceInput): Promise<InvoiceWithRelations>;
}

export const createInvoiceBuilderService = (
  deps: InvoiceBuilderDeps,
): InvoiceBuilderService => {
  const createFromLoadWithFee = async (
    input: CreateFromLoadInput,
  ): Promise<CreateFromLoadResult> => {
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
    const existing = await deps.invoiceRepo.findNonVoidByLoadId(input.loadId, input.organizationId);
    if (existing !== null) {
      throw new ValidationError('A non-void invoice already exists for this load');
    }

    const carrierType = load.carrier?.type ?? 'COMPANY_ASSET';
    const customerRate = new Decimal(
      load.customerRate !== null && load.customerRate !== undefined
        ? String(load.customerRate)
        : '0',
    );

    // Customer-billable accessorials (CUSTOMER or BOTH) are line items on the CUSTOMER invoice.
    const customerAccessorials = load.accessorialCharges.filter((c) =>
      isBilledToCustomer(c.billTo),
    );
    const customerAccessorialsTotal = customerAccessorials.reduce(
      (sum, charge) => sum.add(new Decimal(String(charge.amount))),
      new Decimal(0),
    );

    const subtotal = customerRate;
    const totalAmount = subtotal.add(customerAccessorialsTotal);

    const paymentTerms = load.customer?.paymentTerms ?? 'net_30';
    const paymentTermsDays = load.customer?.paymentTermsDays ?? 30;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);

    const missingSignedBol = load.bolSignedAt === null;
    const invoiceNumber = await generateSequenceNumber('INVOICE', input.organizationId);

    const invoice = await deps.invoiceRepo.create({
      loadId: load.id,
      carrierId: load.carrierId ?? undefined,
      customerId: load.customerId ?? undefined,
      invoiceNumber,
      type: 'CUSTOMER',
      subtotal: subtotal.toNumber(),
      accessorials: customerAccessorialsTotal.toNumber(),
      totalAmount: totalAmount.toNumber(),
      paymentTerms,
      paymentTermsDays,
      dueDate,
      missingSignedBol,
    });

    // Emit so invoicePdfGenerationSubscriber can build + store the PDF
    // asynchronously without blocking invoice creation.
    await deps.eventBus.publish('invoice.draft.created', {
      invoiceId: invoice.id,
      loadId: load.id,
      organizationId: input.organizationId,
      invoiceNumber,
    });

    // Transition load to INVOICE_PENDING
    await deps.loadQuery.updateLoadStatus(load.id, 'INVOICE_PENDING');

    // Resolve dispatch fee for EXTERNAL_CARRIER (billed via separate DISPATCH_FEE invoice).
    let dispatchFeeAmount: Decimal | null = null;
    if (carrierType === 'EXTERNAL_CARRIER' && load.carrier !== null) {
      const carrier = load.carrier;
      const resolved = resolveDispatchFee({
        load: {
          dispatchFeeType: load.dispatchFeeType,
          dispatchFeeAmount:
            load.dispatchFeeAmount !== null && load.dispatchFeeAmount !== undefined
              ? new Prisma.Decimal(String(load.dispatchFeeAmount))
              : null,
        },
        carrier: {
          dispatchFeeType: carrier.dispatchFeeType,
          dispatchFeePercent: new Prisma.Decimal(String(carrier.dispatchFeePercent)),
          dispatchFeeAmount: new Prisma.Decimal(String(carrier.dispatchFeeAmount)),
        },
      });

      // Base: customerRate + customer/both accessorials (if feeIncludesAccessorials), else customerRate only.
      const feeBase = carrier.feeIncludesAccessorials
        ? new Prisma.Decimal(customerRate.toString()).add(
            new Prisma.Decimal(customerAccessorialsTotal.toString()),
          )
        : new Prisma.Decimal(customerRate.toString());

      const feeAmount = computeDispatchFeeAmount({ resolvedFee: resolved, baseAmount: feeBase });
      dispatchFeeAmount = new Decimal(feeAmount.toString());
    }

    deps.logger.info('Invoice created from builder', {
      invoiceId: invoice.id,
      invoiceNumber,
      loadId: load.id,
      type: 'CUSTOMER',
      dispatchFeeAmount:
        dispatchFeeAmount !== null ? dispatchFeeAmount.toFixed(2) : undefined,
    });

    return { invoice, dispatchFeeAmount };
  };

  return {
    createFromLoad: async (input) => {
      const { invoice } = await createFromLoadWithFee(input);
      return invoice;
    },

    createFromLoadWithFee,

    voidInvoice: async (input: VoidInvoiceInput): Promise<InvoiceWithRelations> => {
      const invoice = await deps.invoiceRepo.findById(input.invoiceId, input.organizationId);

      if (invoice === null) {
        throw new NotFoundError('Invoice not found');
      }

      const voidableStatuses = ['DRAFT', 'APPROVED'];
      if (!voidableStatuses.includes(invoice.status)) {
        throw new ValidationError(
          `Only DRAFT or APPROVED invoices can be voided. Current: ${invoice.status}`,
        );
      }

      const updated = await deps.invoiceRepo.updateStatus(invoice.id, input.organizationId, 'VOID');

      // Revert load to DELIVERED
      await deps.loadQuery.updateLoadStatus(invoice.loadId, 'DELIVERED');

      deps.logger.info('Invoice voided', {
        invoiceId: invoice.id,
        loadId: invoice.loadId,
      });

      return updated;
    },
  };
};
