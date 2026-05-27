export type AccessorialBillTo = 'CUSTOMER' | 'CARRIER' | 'BOTH';

/**
 * Normalizes an AccessorialCharge.billTo string to the canonical uppercase form.
 * Handles historical case drift (DB default was lowercase 'customer').
 * Unknown values fall back to 'CUSTOMER'.
 */
export const normalizeBillTo = (raw: string | null | undefined): AccessorialBillTo => {
  if (raw === null || raw === undefined) {
    return 'CUSTOMER';
  }
  const upper = raw.trim().toUpperCase();
  if (upper === 'CARRIER') {
    return 'CARRIER';
  }
  if (upper === 'BOTH') {
    return 'BOTH';
  }
  return 'CUSTOMER';
};

export const isBilledToCustomer = (raw: string | null | undefined): boolean => {
  const normalized = normalizeBillTo(raw);
  return normalized === 'CUSTOMER' || normalized === 'BOTH';
};

export const isBilledToCarrier = (raw: string | null | undefined): boolean => {
  const normalized = normalizeBillTo(raw);
  return normalized === 'CARRIER' || normalized === 'BOTH';
};
