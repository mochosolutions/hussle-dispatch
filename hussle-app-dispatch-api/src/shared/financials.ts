import Decimal from 'decimal.js';
import type { CarrierType } from './constants/carrierTypes';
import { CARRIER_TYPES } from './constants/carrierTypes';
import { OwnerOperatorNotSupportedError } from './errors';

/**
 * Rounding mode applied to all financial calculations.
 * Banker's rounding (half to even) prevents systematic bias in batch processing.
 */
const ROUNDING = Decimal.ROUND_HALF_EVEN;

/** Round a Decimal to 2 decimal places using banker's rounding and serialize. */
const round2 = (value: Decimal): string =>
  value.toDecimalPlaces(2, ROUNDING).toFixed(2);

interface CarrierInput {
  type: CarrierType;
  dispatchFeePercent: string;
  partnerSplitPercent: string;
  feeIncludesAccessorials: boolean;
}

export interface LoadFinancialsInput {
  customerRate: string;
  accessorials: string;
  loadedMiles: number | null;
  carrier: CarrierInput;
}

export interface LoadFinancialsResult {
  customerRate: string;
  accessorials: string;
  dispatchFee: string;
  partnerSplit: string;
  companyShare: string;
  totalRevenue: string;
  ratePerMile: string | null;
}

/**
 * Calculates financial fields for a load given customer rate, accessorials,
 * and carrier configuration.
 *
 * Uses Decimal.js with banker's rounding (ROUND_HALF_EVEN), 2 decimal places,
 * applied once at each final stored value (decision L-002).
 *
 * OWNER_OPERATOR is excluded in this release (decision X-001).
 */
export const calculateLoadFinancials = (
  input: LoadFinancialsInput,
): LoadFinancialsResult => {
  const { customerRate, accessorials, loadedMiles, carrier } = input;

  if (carrier.type === CARRIER_TYPES.OWNER_OPERATOR) {
    throw new OwnerOperatorNotSupportedError();
  }

  const rate = new Decimal(customerRate);
  const acc = new Decimal(accessorials);
  const feePercent = new Decimal(carrier.dispatchFeePercent).dividedBy(100);
  const splitPercent = new Decimal(carrier.partnerSplitPercent).dividedBy(100);

  const feeBase = carrier.feeIncludesAccessorials ? rate.plus(acc) : rate;
  const dispatchFee = feeBase.times(feePercent).toDecimalPlaces(2, ROUNDING);
  const partnerSplit = dispatchFee.times(splitPercent).toDecimalPlaces(2, ROUNDING);
  const companyShare = dispatchFee.minus(partnerSplit).toDecimalPlaces(2, ROUNDING);

  const totalRevenue =
    carrier.type === CARRIER_TYPES.COMPANY_ASSET
      ? rate.plus(acc).toDecimalPlaces(2, ROUNDING)
      : dispatchFee;

  const ratePerMile =
    loadedMiles !== null && loadedMiles !== 0
      ? round2(rate.dividedBy(loadedMiles))
      : null;

  return {
    customerRate: round2(rate),
    accessorials: round2(acc),
    dispatchFee: dispatchFee.toFixed(2),
    partnerSplit: partnerSplit.toFixed(2),
    companyShare: companyShare.toFixed(2),
    totalRevenue: totalRevenue.toFixed(2),
    ratePerMile,
  };
};
