import Decimal from 'decimal.js';
import type { CarrierType } from './constants/carrierTypes';
import { CARRIER_TYPES } from './constants/carrierTypes';

/**
 * Rounding mode applied to all financial calculations.
 * Banker's rounding (half to even) prevents systematic bias in batch processing.
 */
export const ROUNDING = Decimal.ROUND_HALF_EVEN;

/** Round a Decimal to 2 decimal places using banker's rounding and serialize. */
export const round2 = (value: Decimal): string =>
  value.toDecimalPlaces(2, ROUNDING).toFixed(2);

/**
 * LoadFinancialsInput — pure inputs to the load financial calc.
 *
 * Post-US-10, this only contains snapshot values that live on the Load row
 * (US-09 columns) plus a few transient derived values (vehicleCpm, estimatedHours)
 * that callers compute. NO references to Carrier / Driver / Dispatcher rows are
 * accepted — historical loads keep their booking-time terms even when those
 * rows change later.
 *
 * carrierType is still required because totalRevenue branches on it; US-09 did
 * NOT snapshot carrierType. If carrierType ever needs to be historical, add a
 * Load.carrierTypeSnapshot column in a future story.
 */
export interface LoadFinancialsInput {
  // Money + miles from the load itself
  customerRate: string;
  loadedMiles: number | null;
  totalMiles: number | null;

  // Snapshotted negotiation terms (US-09 Load columns)
  dispatchFeeType: 'PERCENTAGE' | 'FLAT' | null;
  dispatchFeeAmount: string | null;
  partnerSplitPercent: string | null;
  driverPayType: 'PERCENTAGE' | 'PER_MILE' | 'PER_HOUR' | 'FLAT_RATE' | null;
  driverPayRate: string | null;
  dispatcherCommissionType:
    | 'PERCENTAGE_OF_MARGIN'
    | 'PERCENTAGE_OF_GROSS'
    | 'FLAT_PER_LOAD'
    | null;
  dispatcherCommissionRate: string | null;
  feeIncludesAccessorials: boolean | null;
  payFromNet: boolean | null;

  // Non-snapshot inputs (still come from callers)
  carrierType: CarrierType;
  carrierPayoutOverride?: string;
  vehicleCpm?: number;
  estimatedHours?: number;
}

export interface LoadFinancialsResult {
  customerRate: string;
  accessorials: string;
  dispatchFee: string;
  partnerSplit: string;
  companyShare: string;
  totalRevenue: string;
  ratePerMile: string | null;
  ratePerTotalMile: string | null;
  carrierPayout: string;
  companyMargin: string;
  driverPay: string | null;
  estimatedCost: string | null;
  dispatcherComm: string | null;
  companyNet: string | null;
}

interface DriverPayConfig {
  payType: 'PERCENTAGE' | 'PER_MILE' | 'PER_HOUR' | 'FLAT_RATE';
  payRate: string;
  carrierPayout: Decimal;
  loadedMiles: number | null;
  estimatedHours?: number;
  payFromNet: boolean;
  estimatedCost: Decimal | null;
}

const calculateDriverPay = (config: DriverPayConfig): string | null => {
  const rate = new Decimal(config.payRate);

  switch (config.payType) {
    case 'PERCENTAGE': {
      let payBase = config.carrierPayout;
      if (config.payFromNet && config.estimatedCost !== null) {
        payBase = config.carrierPayout.minus(config.estimatedCost);
      }
      return round2(payBase.times(rate).dividedBy(100));
    }
    case 'PER_MILE':
      if (config.loadedMiles === null || config.loadedMiles === 0) return null;
      return round2(rate.times(config.loadedMiles));
    case 'PER_HOUR':
      if (config.estimatedHours === undefined || config.estimatedHours === null) return null;
      return round2(rate.times(config.estimatedHours));
    case 'FLAT_RATE':
      return round2(rate);
    default:
      return null;
  }
};

interface DispatcherCommConfig {
  commissionType: 'PERCENTAGE_OF_MARGIN' | 'PERCENTAGE_OF_GROSS' | 'FLAT_PER_LOAD';
  commissionRate: string;
  companyMargin: Decimal;
  gross: Decimal;
}

const calculateDispatcherCommission = (config: DispatcherCommConfig): string => {
  const rate = new Decimal(config.commissionRate);

  switch (config.commissionType) {
    case 'PERCENTAGE_OF_MARGIN':
      return round2(config.companyMargin.times(rate).dividedBy(100));
    case 'PERCENTAGE_OF_GROSS':
      return round2(config.gross.times(rate).dividedBy(100));
    case 'FLAT_PER_LOAD':
      return round2(rate);
    default:
      return round2(new Decimal(0));
  }
};

/**
 * Calculates financial fields for a load given the Load's snapshotted negotiation
 * terms (US-09 columns) and the accessorials total.
 *
 * Pure function — no I/O, no Prisma. Decimal.js with banker's rounding applied
 * once per stored value (decision L-002).
 *
 * NULL semantics (US-10):
 *  - dispatchFeeType null → dispatchFee = 0
 *  - partnerSplitPercent null → partnerSplit = 0
 *  - driverPayRate / driverPayType null → driverPay = null
 *  - dispatcherCommissionRate / dispatcherCommissionType null → dispatcherComm = null
 *  - feeIncludesAccessorials null → treated as false
 *  - payFromNet null → treated as false
 */
export const calculateLoadFinancials = (
  input: LoadFinancialsInput,
  accessorialsSum: Decimal,
): LoadFinancialsResult => {
  const rate = new Decimal(input.customerRate);
  const acc = accessorialsSum;

  // --- dispatchFee (NULL → 0) -----------------------------------------------
  const feeIncludesAccessorials = input.feeIncludesAccessorials ?? false;
  const payFromNet = input.payFromNet ?? false;
  const feeBase = feeIncludesAccessorials ? rate.plus(acc) : rate;

  let dispatchFee: Decimal;
  if (input.dispatchFeeType === null) {
    dispatchFee = new Decimal(0);
  } else if (input.dispatchFeeType === 'PERCENTAGE') {
    // dispatchFeeAmount holds the percent value (e.g., "10.0000" for 10%)
    const pct = input.dispatchFeeAmount !== null
      ? new Decimal(input.dispatchFeeAmount).dividedBy(100)
      : new Decimal(0);
    dispatchFee = feeBase.times(pct).toDecimalPlaces(2, ROUNDING);
  } else {
    // FLAT
    dispatchFee = input.dispatchFeeAmount !== null
      ? new Decimal(input.dispatchFeeAmount).toDecimalPlaces(2, ROUNDING)
      : new Decimal(0);
  }

  // --- partnerSplit (NULL → 0) ----------------------------------------------
  const partnerSplit = input.partnerSplitPercent !== null
    ? rate.plus(acc).times(new Decimal(input.partnerSplitPercent).dividedBy(100))
        .toDecimalPlaces(2, ROUNDING)
    : new Decimal(0);

  const companyShare = dispatchFee.minus(partnerSplit).toDecimalPlaces(2, ROUNDING);

  // companyMargin is the same value as dispatchFee
  const companyMargin = dispatchFee;

  // gross = customerRate + accessorials
  const gross = rate.plus(acc);

  // carrierPayout = manual override OR (gross - companyMargin)
  const carrierPayoutDecimal =
    input.carrierPayoutOverride !== undefined
      ? new Decimal(input.carrierPayoutOverride)
      : gross.minus(companyMargin).toDecimalPlaces(2, ROUNDING);

  // estimatedCost = vehicleCpm × totalMiles
  const estimatedCostDecimal =
    input.vehicleCpm !== undefined &&
    input.totalMiles !== null &&
    input.totalMiles !== 0
      ? new Decimal(input.vehicleCpm).times(input.totalMiles).toDecimalPlaces(2, ROUNDING)
      : null;

  // --- driverPay (NULL → null) ----------------------------------------------
  const driverPayResult =
    input.driverPayType !== null && input.driverPayRate !== null
      ? calculateDriverPay({
          payType: input.driverPayType,
          payRate: input.driverPayRate,
          carrierPayout: carrierPayoutDecimal,
          loadedMiles: input.loadedMiles,
          estimatedHours: input.estimatedHours,
          payFromNet,
          estimatedCost: estimatedCostDecimal,
        })
      : null;

  // --- dispatcherComm (NULL → null) -----------------------------------------
  const dispatcherCommResult =
    input.dispatcherCommissionType !== null && input.dispatcherCommissionRate !== null
      ? calculateDispatcherCommission({
          commissionType: input.dispatcherCommissionType,
          commissionRate: input.dispatcherCommissionRate,
          companyMargin,
          gross,
        })
      : null;

  // companyNet = companyMargin - dispatcherComm
  const companyNet =
    dispatcherCommResult !== null
      ? round2(companyMargin.minus(new Decimal(dispatcherCommResult)))
      : null;

  const totalRevenue =
    input.carrierType === CARRIER_TYPES.COMPANY_ASSET
      ? rate.plus(acc).toDecimalPlaces(2, ROUNDING)
      : companyMargin; // EXTERNAL_CARRIER and LEASED_CARRIER both use companyMargin

  const ratePerMile =
    input.loadedMiles !== null && input.loadedMiles !== 0
      ? round2(rate.dividedBy(input.loadedMiles))
      : null;

  const ratePerTotalMile =
    input.totalMiles !== null && input.totalMiles !== 0
      ? round2(rate.dividedBy(input.totalMiles))
      : null;

  return {
    customerRate: round2(rate),
    accessorials: round2(acc),
    dispatchFee: dispatchFee.toFixed(2),
    partnerSplit: partnerSplit.toFixed(2),
    companyShare: companyShare.toFixed(2),
    totalRevenue: totalRevenue.toFixed(2),
    ratePerMile,
    ratePerTotalMile,
    carrierPayout: carrierPayoutDecimal.toFixed(2),
    companyMargin: companyMargin.toFixed(2),
    driverPay: driverPayResult,
    estimatedCost: estimatedCostDecimal !== null ? estimatedCostDecimal.toFixed(2) : null,
    dispatcherComm: dispatcherCommResult,
    companyNet,
  };
};
