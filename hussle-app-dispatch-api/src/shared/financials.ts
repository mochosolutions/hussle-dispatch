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

interface CarrierInput {
  type: CarrierType;
  dispatchFeePercent: string;
  partnerSplitPercent: string;
  feeIncludesAccessorials: boolean;
  feeType: string; // Only PER_LOAD_PERCENT implemented for now
  payFromNet: boolean;
}

export interface LoadFinancialsInput {
  customerRate: string;
  accessorials: string;
  loadedMiles: number | null;
  totalMiles: number | null;
  carrier: CarrierInput;
  carrierPayoutOverride?: string;
  vehicleCpm?: number;
  driverPay?: {
    payType: string; // DriverPayType values: PERCENTAGE, PER_MILE, PER_HOUR, FLAT_RATE
    payRate: string;
    estimatedHours?: number;
  };
  dispatcherComm?: {
    commissionType: string; // DispatcherCommType: PERCENTAGE_OF_MARGIN, PERCENTAGE_OF_GROSS, FLAT_PER_LOAD
    commissionRate: string;
  };
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

const calculateDriverPay = (config: {
  payType: string;
  payRate: string;
  carrierPayout: Decimal;
  loadedMiles: number | null;
  estimatedHours?: number;
  payFromNet: boolean;
  estimatedCost: Decimal | null;
}): string | null => {
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

const calculateDispatcherCommission = (config: {
  commissionType: string;
  commissionRate: string;
  companyMargin: Decimal;
  gross: Decimal;
}): string => {
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
 * Calculates financial fields for a load given customer rate, accessorials,
 * and carrier configuration.
 *
 * Uses Decimal.js with banker's rounding (ROUND_HALF_EVEN), 2 decimal places,
 * applied once at each final stored value (decision L-002).
 */
export const calculateLoadFinancials = (
  input: LoadFinancialsInput,
): LoadFinancialsResult => {
  const { customerRate, accessorials, loadedMiles, carrier } = input;

  const rate = new Decimal(customerRate);
  const acc = new Decimal(accessorials);
  const feePercent = new Decimal(carrier.dispatchFeePercent).dividedBy(100);
  const splitPercent = new Decimal(carrier.partnerSplitPercent).dividedBy(100);

  const feeBase = carrier.feeIncludesAccessorials ? rate.plus(acc) : rate;
  const dispatchFee = feeBase.times(feePercent).toDecimalPlaces(2, ROUNDING);
  const partnerSplit = rate.plus(acc).times(splitPercent).toDecimalPlaces(2, ROUNDING);
  const companyShare = dispatchFee.minus(partnerSplit).toDecimalPlaces(2, ROUNDING);

  // companyMargin is the new name for dispatchFee (same value)
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

  // driverPay
  const driverPayResult =
    input.driverPay !== undefined
      ? calculateDriverPay({
          payType: input.driverPay.payType,
          payRate: input.driverPay.payRate,
          carrierPayout: carrierPayoutDecimal,
          loadedMiles,
          estimatedHours: input.driverPay.estimatedHours,
          payFromNet: carrier.payFromNet,
          estimatedCost: estimatedCostDecimal,
        })
      : null;

  // dispatcherComm
  const dispatcherCommResult =
    input.dispatcherComm !== undefined
      ? calculateDispatcherCommission({
          commissionType: input.dispatcherComm.commissionType,
          commissionRate: input.dispatcherComm.commissionRate,
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
    carrier.type === CARRIER_TYPES.COMPANY_ASSET
      ? rate.plus(acc).toDecimalPlaces(2, ROUNDING)
      : companyMargin; // EXTERNAL_CARRIER and LEASED_CARRIER both use companyMargin

  const ratePerMile =
    loadedMiles !== null && loadedMiles !== 0
      ? round2(rate.dividedBy(loadedMiles))
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
