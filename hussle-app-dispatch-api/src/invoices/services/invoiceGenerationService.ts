import Decimal from 'decimal.js';
import type { Logger } from '../../shared/utils/logger';
import { generateSequenceNumber } from '../../shared/sequenceGenerator';
import type { InvoiceRepoPort, InvoiceLoadQueryPort } from '../types/invoiceTypes';

interface InvoiceGenerationDeps {
  invoiceRepo: InvoiceRepoPort;
  loadQuery: InvoiceLoadQueryPort;
  logger: Logger;
}

/**
 * Generates an invoice from a delivered load.
 * - COMPANY_ASSET carrier → CUSTOMER invoice (subtotal = customerRate + accessorials)
 * - EXTERNAL_CARRIER carrier → DISPATCH_FEE invoice (subtotal = dispatchFee)
 * - Idempotency guard: skips if invoice already exists for this load
 * - Checks bolSignedAt: if null, sets missingSignedBol=true
 * - Transitions load to INVOICE_PENDING
 */
export const generateFromDelivery = async (
  loadId: string,
  deps: InvoiceGenerationDeps,
): Promise<void> => {
  // Idempotency guard
  const existing = await deps.invoiceRepo.findByLoadId(loadId);

  if (existing !== null) {
    deps.logger.info('Invoice already exists for load, skipping', { loadId });
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
  const dispatchFee = new Decimal(
    load.dispatchFee !== null && load.dispatchFee !== undefined
      ? String(load.dispatchFee)
      : '0',
  );

  // Sum accessorial charges
  const accessorialsTotal = load.accessorialCharges.reduce(
    (sum, charge) => sum.add(new Decimal(String(charge.amount))),
    new Decimal(0),
  );

  const isCompanyAsset = carrierType === 'COMPANY_ASSET';
  const invoiceType = isCompanyAsset ? 'CUSTOMER' : 'DISPATCH_FEE';
  const subtotal = isCompanyAsset ? customerRate : dispatchFee;
  const totalAmount = isCompanyAsset ? subtotal.add(accessorialsTotal) : subtotal;

  // Get payment terms from broker contact
  const paymentTerms = load.broker?.paymentTerms ?? 'net_30';
  const paymentTermsDays = load.broker?.paymentTermsDays ?? 30;

  // Calculate due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + paymentTermsDays);

  // Check for missing signed BOL
  const missingSignedBol = load.bolSignedAt === null;

  // Generate invoice number
  const invoiceNumber = await generateSequenceNumber('INVOICE', load.organizationId);

  await deps.invoiceRepo.create({
    loadId: load.id,
    carrierId: load.carrierId ?? undefined,
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
  deps: InvoiceGenerationDeps,
): Promise<void> => {
  // Idempotency guard
  const existing = await deps.invoiceRepo.findByLoadId(loadId);

  if (existing !== null) {
    deps.logger.info('Invoice already exists for TONU load, skipping', { loadId });
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

  const paymentTerms = load.broker?.paymentTerms ?? 'net_30';
  const paymentTermsDays = load.broker?.paymentTermsDays ?? 30;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + paymentTermsDays);

  const invoiceNumber = await generateSequenceNumber('INVOICE', load.organizationId);

  await deps.invoiceRepo.create({
    loadId: load.id,
    carrierId: load.carrierId ?? undefined,
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

  deps.logger.info('TONU invoice generated', {
    loadId: load.id,
    invoiceNumber,
    amount: tonuAmount.toFixed(2),
  });
};
