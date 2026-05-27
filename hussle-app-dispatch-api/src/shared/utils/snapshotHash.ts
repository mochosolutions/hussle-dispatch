import { createHash } from 'crypto';
import Decimal from 'decimal.js';
import { ROUNDING } from '../financials';

interface HashableLineItem {
  type: string;
  referenceId?: string | null;
  amount: number | string | Decimal;
}

const normalizeAmount = (amount: HashableLineItem['amount']): string =>
  new Decimal(String(amount)).toDecimalPlaces(2, ROUNDING).toFixed(2);

/**
 * Deterministic hash over the (type, referenceId, amount) triplets of settlement
 * line items. Order-independent (sorted before hashing) so reordering rows does
 * not change the hash. Amounts are normalized to 2dp strings so Decimal/number
 * input produces the same hash.
 */
export const computeSettlementHash = (lineItems: HashableLineItem[]): string => {
  const sorted = [...lineItems].sort((a, b) =>
    `${a.type}:${a.referenceId ?? ''}`.localeCompare(`${b.type}:${b.referenceId ?? ''}`),
  );
  const payload = JSON.stringify(
    sorted.map((li) => ({
      type: li.type,
      referenceId: li.referenceId ?? null,
      amount: normalizeAmount(li.amount),
    })),
  );
  return createHash('sha256').update(payload).digest('hex');
};
