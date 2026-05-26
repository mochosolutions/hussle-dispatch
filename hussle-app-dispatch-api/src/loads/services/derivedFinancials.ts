import Decimal from 'decimal.js';
import type { Load, InvoiceReadiness } from '@prisma/client';
import { CARRIER_TYPES, type CarrierType } from '@/shared/constants/carrierTypes';
import {
  calculateLoadFinancials,
  type LoadFinancialsInput,
  type LoadFinancialsResult,
} from '@/shared/financials';

/**
 * Prisma select clause projecting all Load columns required by
 * computeLoadFinancials. Use via spread:
 *   prisma.load.findMany({ select: { ...LOAD_FINANCIALS_SNAPSHOT_SELECT, ... } })
 *
 * Plus `accessorialCharges: { select: { amount: true } }` for the accessorials
 * sum. Per the US-11b refactor, callers compute financials in JS on read.
 */
export const LOAD_FINANCIALS_SNAPSHOT_SELECT = {
  customerRate: true,
  loadedMiles: true,
  totalMiles: true,
  dispatchFeeType: true,
  dispatchFeeAmount: true,
  partnerSplitPercent: true,
  driverPayType: true,
  driverPayRate: true,
  dispatcherCommissionType: true,
  dispatcherCommissionRate: true,
  feeIncludesAccessorials: true,
  payFromNet: true,
  carrierType: true,
} as const;

/**
 * Sums accessorial-charge amounts into a single Decimal. Accepts the minimal
 * `{ amount }` projection used across the load module's read paths.
 */
export const sumAccessorials = (
  charges: { amount: { toString(): string } }[] | undefined | null,
): Decimal =>
  (charges ?? []).reduce(
    (sum, charge) => sum.plus(new Decimal(String(charge.amount))),
    new Decimal(0),
  );

/**
 * Thin wrapper that destructures the Load row's snapshot columns and forwards
 * them to the pure calculateLoadFinancials. All rate inputs — including
 * carrierType (US-09b) — are now snapshotted on Load.
 *
 * estimatedHours / vehicleCpm / carrierPayoutOverride are still callsite-derived
 * (stops timing, vehicle expenses, manual overrides) — not Load-snapshot values.
 */
export interface ComputeLoadFinancialsExtras {
  vehicleCpm?: number;
  estimatedHours?: number;
  carrierPayoutOverride?: string;
}

/**
 * Structural subset of Load needed by computeLoadFinancials — the snapshot
 * inputs. Allows partial Prisma selects (e.g. dashboard / weeklyGross / metrics
 * aggregates) to satisfy the compute contract without projecting full Load rows.
 */
export type LoadFinancialsSnapshot = Pick<
  Load,
  | 'customerRate'
  | 'loadedMiles'
  | 'totalMiles'
  | 'dispatchFeeType'
  | 'dispatchFeeAmount'
  | 'partnerSplitPercent'
  | 'driverPayType'
  | 'driverPayRate'
  | 'dispatcherCommissionType'
  | 'dispatcherCommissionRate'
  | 'feeIncludesAccessorials'
  | 'payFromNet'
  | 'carrierType'
>;

export const computeLoadFinancials = (
  load: LoadFinancialsSnapshot,
  accessorialsSum: Decimal,
  extras: ComputeLoadFinancialsExtras = {},
): LoadFinancialsResult => {
  if (load.customerRate === null) {
    throw new Error('computeLoadFinancials: load.customerRate is required');
  }

  // Default to EXTERNAL_CARRIER for any pre-US-09b row that slipped through
  // backfill — the most conservative branch for totalRevenue math.
  const carrierType: CarrierType = load.carrierType ?? CARRIER_TYPES.EXTERNAL_CARRIER;

  const input: LoadFinancialsInput = {
    customerRate: load.customerRate.toString(),
    loadedMiles: load.loadedMiles,
    totalMiles: load.totalMiles ?? null,
    dispatchFeeType: load.dispatchFeeType,
    dispatchFeeAmount:
      load.dispatchFeeAmount !== null && load.dispatchFeeAmount !== undefined
        ? load.dispatchFeeAmount.toString()
        : null,
    partnerSplitPercent:
      load.partnerSplitPercent !== null && load.partnerSplitPercent !== undefined
        ? load.partnerSplitPercent.toString()
        : null,
    driverPayType: load.driverPayType ?? null,
    driverPayRate:
      load.driverPayRate !== null && load.driverPayRate !== undefined
        ? load.driverPayRate.toString()
        : null,
    dispatcherCommissionType: load.dispatcherCommissionType ?? null,
    dispatcherCommissionRate:
      load.dispatcherCommissionRate !== null && load.dispatcherCommissionRate !== undefined
        ? load.dispatcherCommissionRate.toString()
        : null,
    feeIncludesAccessorials: load.feeIncludesAccessorials ?? null,
    payFromNet: load.payFromNet ?? null,
    carrierType,
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
  documents: { type: string }[],
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
