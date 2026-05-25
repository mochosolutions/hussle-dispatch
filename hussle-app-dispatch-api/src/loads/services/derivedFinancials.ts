import Decimal from 'decimal.js';
import type { Load, Document, InvoiceReadiness } from '@prisma/client';
import type { CarrierType } from '@/shared/constants/carrierTypes';
import {
  calculateLoadFinancials,
  type LoadFinancialsInput,
  type LoadFinancialsResult,
} from '@/shared/financials';

/**
 * Thin wrapper that destructures the Load row's snapshot columns and forwards
 * them to the pure calculateLoadFinancials. carrierType is passed separately
 * because it's not yet snapshotted on the Load (US-09 scope).
 *
 * estimatedHours / vehicleCpm / carrierPayoutOverride are still callsite-derived
 * (stops timing, vehicle expenses, manual overrides) — not Load-snapshot values.
 */
export interface ComputeLoadFinancialsExtras {
  carrierType: CarrierType;
  vehicleCpm?: number;
  estimatedHours?: number;
  carrierPayoutOverride?: string;
}

export const computeLoadFinancials = (
  load: Load,
  accessorialsSum: Decimal,
  extras: ComputeLoadFinancialsExtras,
): LoadFinancialsResult => {
  if (load.customerRate === null) {
    throw new Error('computeLoadFinancials: load.customerRate is required');
  }

  const input: LoadFinancialsInput = {
    customerRate: load.customerRate.toString(),
    loadedMiles: load.loadedMiles,
    totalMiles: load.totalMiles ?? null,
    dispatchFeeType: load.dispatchFeeType,
    dispatchFeeAmount: load.dispatchFeeAmount !== null ? load.dispatchFeeAmount.toString() : null,
    partnerSplitPercent:
      load.partnerSplitPercent !== null ? load.partnerSplitPercent.toString() : null,
    driverPayType: load.driverPayType,
    driverPayRate: load.driverPayRate !== null ? load.driverPayRate.toString() : null,
    dispatcherCommissionType: load.dispatcherCommissionType,
    dispatcherCommissionRate:
      load.dispatcherCommissionRate !== null
        ? load.dispatcherCommissionRate.toString()
        : null,
    feeIncludesAccessorials: load.feeIncludesAccessorials,
    payFromNet: load.payFromNet,
    carrierType: extras.carrierType,
    vehicleCpm: extras.vehicleCpm,
    estimatedHours: extras.estimatedHours,
    carrierPayoutOverride: extras.carrierPayoutOverride,
  };

  return calculateLoadFinancials(input, accessorialsSum);
};

/**
 * Mirrors invoiceReadinessSubscriber's evaluateReadiness — extracted as a pure
 * function so consumers can derive the readiness signal on-read. US-08 surfaced
 * that Load.invoiceReadiness was never persisted; this is the first time the
 * rule lives as a function.
 *
 * Rules (matching subscriber):
 *  - Load must be DELIVERED or INVOICE_PENDING → otherwise NOT_READY
 *  - All three required docs (BROKER_RATE_CON, BOL_SIGNED, POD) must be present
 *    → AWAITING_DOCUMENTS if any missing, READY if all present.
 *
 * Note: the subscriber also flips to INVOICE_CREATED after creating an invoice;
 * detecting that from documents alone is impossible — callers that already know
 * an invoice exists should treat that as a higher-priority signal.
 */
export const computeInvoiceReadiness = (
  load: Pick<Load, 'status'>,
  documents: Pick<Document, 'type'>[],
): InvoiceReadiness => {
  const evaluableStatuses = ['DELIVERED', 'INVOICE_PENDING'];
  if (!evaluableStatuses.includes(load.status)) {
    return 'NOT_READY';
  }

  const docTypes = documents.map((d) => d.type);
  const hasRateCon = docTypes.includes('BROKER_RATE_CON');
  const hasSignedBol = docTypes.includes('BOL_SIGNED');
  const hasPod = docTypes.includes('POD');

  if (!hasRateCon || !hasSignedBol || !hasPod) {
    return 'AWAITING_DOCUMENTS';
  }

  return 'READY';
};
