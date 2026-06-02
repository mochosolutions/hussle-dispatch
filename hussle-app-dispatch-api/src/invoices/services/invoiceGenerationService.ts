import Decimal from 'decimal.js';
import type { Logger } from '../../shared/utils/logger';
import type { EventBus } from '../../shared/messaging/eventBus';
import { generateSequenceNumber } from '../../shared/sequenceGenerator';
import {
  computeLoadFinancials,
  sumAccessorials,
  type LoadFinancialsSnapshot,
} from '../../loads/services/derivedFinancials';
import type { InvoiceRepoPort, InvoiceLoadQueryPort } from '../types/invoiceTypes';
import type { DocumentQueryPort } from '../types/documentPacketTypes';

interface InvoiceGenerationDeps {
  invoiceRepo: InvoiceRepoPort;
  loadQuery: InvoiceLoadQueryPort;
  documentQuery: DocumentQueryPort;
  eventBus: EventBus;
  logger: Logger;
}

/**
 * Generates an invoice from a delivered load.
 * - COMPANY_ASSET carrier → CUSTOMER invoice (subtotal = customerRate + accessorials)
 * - LEASED_CARRIER carrier → CUSTOMER invoice (your authority; you bill the customer)
 * - EXTERNAL_CARRIER carrier → DISPATCH_FEE invoice (subtotal = dispatchFee)
 * - Idempotency guard: skips if invoice already exists for this load
 * - Derives missingSignedBol from confirmed documents (BOL_SIGNED present?),
 *   independent of the Load.bolSignedAt projection column
 * - Transitions load to INVOICE_PENDING
 */
export const generateFromDelivery = async (
  loadId: string,
  organizationId: string,
  deps: InvoiceGenerationDeps,
): Promise<void> => {
  // Idempotency guard
  const existing = await deps.invoiceRepo.findNonVoidByLoadId(loadId, organizationId);

  if (existing !== null) {
    deps.logger.info('Non-void invoice already exists for load, skipping', { loadId });
    return;
  }

  const load = await deps.loadQuery.findLoadById(loadId);

  if (load === null) {
    deps.logger.warn('Load not found for invoice generation', { loadId });
    return;
  }

  const carrierType = load.carrier?.type ?? 'COMPANY_ASSET';
  const customerRate = new Decimal(
    load.customerRate !== null && load.customerRate !== undefined
      ? String(load.customerRate)
      : '0',
  );

  // Sum accessorial charges
  const accessorialsTotal = sumAccessorials(load.accessorialCharges);

  // US-11b: derive dispatchFee from the Load row's snapshot inputs on-read
  // instead of reading the persisted Load.dispatchFee cache column.
  const snapshot: LoadFinancialsSnapshot = {
    customerRate: load.customerRate,
    loadedMiles: load.loadedMiles,
    totalMiles: load.totalMiles,
    dispatchFeeType: load.dispatchFeeType,
    dispatchFeeAmount: load.dispatchFeeAmount,
    partnerSplitPercent: load.partnerSplitPercent,
    driverPayType: load.driverPayType,
    driverPayRate: load.driverPayRate,
    dispatcherCommissionType: load.dispatcherCommissionType,
    dispatcherCommissionRate: load.dispatcherCommissionRate,
    feeIncludesAccessorials: load.feeIncludesAccessorials,
    payFromNet: load.payFromNet,
    carrierType: load.carrierType,
  };
  const dispatchFee = load.customerRate !== null
    ? new Decimal(computeLoadFinancials(snapshot, accessorialsTotal).dispatchFee)
    : new Decimal(0);

  // LEASED_CARRIER uses YOUR authority — you invoice the customer like COMPANY_ASSET.
  // Only EXTERNAL_CARRIER results in a DISPATCH_FEE invoice.
  const billsCustomer =
    carrierType === 'COMPANY_ASSET' || carrierType === 'LEASED_CARRIER';
  const invoiceType = billsCustomer ? 'CUSTOMER' : 'DISPATCH_FEE';
  const subtotal = billsCustomer ? customerRate : dispatchFee;
  const totalAmount = billsCustomer ? subtotal.add(accessorialsTotal) : subtotal;

  // Get payment terms from customer, fallback to net_30
  const paymentTerms = load.customer?.paymentTerms ?? 'net_30';
  const paymentTermsDays = load.customer?.paymentTermsDays ?? 30;

  // Calculate due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + paymentTermsDays);

  // Missing-signed-BOL is derived from confirmed documents (the durable
  // source of truth), not the Load.bolSignedAt projection — a confirmed
  // BOL_SIGNED doc with a not-yet-backfilled bolSignedAt must still count.
  const confirmedDocs = await deps.documentQuery.findConfirmedByEntity('load', loadId);
  const docTypes = confirmedDocs.map((d) => d.type);
  const missingSignedBol = !docTypes.includes('BOL_SIGNED');

  // Generate invoice number
  const invoiceNumber = await generateSequenceNumber('INVOICE', load.organizationId);

  await deps.invoiceRepo.create({
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
    notes: missingSignedBol ? 'Missing signed BOL at time of invoice generation' : undefined,
  });

  // Transition load to INVOICE_PENDING
  await deps.loadQuery.updateLoadStatus(load.id, 'INVOICE_PENDING');

  deps.logger.info('Invoice generated from delivery', {
    loadId: load.id,
    invoiceNumber,
    type: invoiceType,
    totalAmount: totalAmount.toFixed(2),
    missingSignedBol,
  });
};

/**
 * Generates a TONU invoice for a load.
 * Uses the TONU accessorial charge as the invoice amount.
 */
export const generateTonuInvoice = async (
  loadId: string,
  organizationId: string,
  deps: InvoiceGenerationDeps,
): Promise<void> => {
  // Idempotency guard
  const existing = await deps.invoiceRepo.findNonVoidByLoadId(loadId, organizationId);

  if (existing !== null) {
    deps.logger.info('Non-void invoice already exists for TONU load, skipping', { loadId });
    return;
  }

  const load = await deps.loadQuery.findLoadById(loadId);

  if (load === null) {
    deps.logger.warn('Load not found for TONU invoice generation', { loadId });
    return;
  }

  // Find TONU accessorial
  const tonuCharge = load.accessorialCharges.find((c) => c.type === 'TONU');
  const tonuAmount = tonuCharge !== undefined
    ? new Decimal(String(tonuCharge.amount))
    : new Decimal(250);

  const paymentTerms = load.customer?.paymentTerms ?? 'net_30';
  const paymentTermsDays = load.customer?.paymentTermsDays ?? 30;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + paymentTermsDays);

  const invoiceNumber = await generateSequenceNumber('INVOICE', load.organizationId);

  const invoice = await deps.invoiceRepo.create({
    loadId: load.id,
    carrierId: load.carrierId ?? undefined,
    customerId: load.customerId ?? undefined,
    invoiceNumber,
    type: 'CUSTOMER',
    subtotal: tonuAmount.toNumber(),
    accessorials: 0,
    totalAmount: tonuAmount.toNumber(),
    paymentTerms,
    paymentTermsDays,
    dueDate,
    missingSignedBol: false,
    notes: 'TONU invoice',
  });

  await deps.eventBus.publish('invoice.draft.created', {
    invoiceId: invoice.id,
    loadId: load.id,
    organizationId: load.organizationId,
    invoiceNumber,
  });

  deps.logger.info('TONU invoice generated', {
    loadId: load.id,
    invoiceNumber,
    amount: tonuAmount.toFixed(2),
  });
};
