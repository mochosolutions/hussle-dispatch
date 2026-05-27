import { differenceInDays, isPast, parse } from 'date-fns';

interface InsuranceExpiryStatus {
  label: string;
  color: 'error' | 'warning' | 'success' | 'default';
}

const SELECTOR_DATE_FORMAT = 'MM/dd/yyyy';

/**
 * Calculates insurance expiry badge status from a pre-formatted date string (MM/dd/yyyy).
 * Returns null when no badge should be shown (no date, or more than 30 days out).
 */
export const getInsuranceExpiryStatus = (
  insuranceExpiry: string | null | undefined,
): InsuranceExpiryStatus | null => {
  if (!insuranceExpiry) {
    return null;
  }

  const expiryDate = parse(insuranceExpiry, SELECTOR_DATE_FORMAT, new Date());

  if (isPast(expiryDate)) {
    return { label: 'Insurance Expired', color: 'error' };
  }

  const daysRemaining = differenceInDays(expiryDate, new Date());

  if (daysRemaining <= 7) {
    return { label: `Expires in ${daysRemaining} days`, color: 'error' };
  }

  if (daysRemaining <= 30) {
    return { label: `Expires in ${daysRemaining} days`, color: 'warning' };
  }

  return null;
};
