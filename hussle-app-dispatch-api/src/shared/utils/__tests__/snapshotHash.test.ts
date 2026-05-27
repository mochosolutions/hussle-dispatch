import Decimal from 'decimal.js';
import { computeSettlementHash } from '../snapshotHash';

describe('computeSettlementHash', () => {
  it('produces the same hash for identical input', () => {
    const items = [
      { type: 'LOAD_REVENUE', referenceId: 'load-1', amount: 2500 },
      { type: 'DISPATCH_FEE', referenceId: 'load-1', amount: 250 },
    ];

    expect(computeSettlementHash(items)).toBe(computeSettlementHash(items));
  });

  it('is order-independent', () => {
    const items1 = [
      { type: 'LOAD_REVENUE', referenceId: 'load-1', amount: 2500 },
      { type: 'DISPATCH_FEE', referenceId: 'load-1', amount: 250 },
    ];
    const items2 = [
      { type: 'DISPATCH_FEE', referenceId: 'load-1', amount: 250 },
      { type: 'LOAD_REVENUE', referenceId: 'load-1', amount: 2500 },
    ];

    expect(computeSettlementHash(items1)).toBe(computeSettlementHash(items2));
  });

  it('changes when an amount changes', () => {
    const before = [{ type: 'LOAD_REVENUE', referenceId: 'load-1', amount: 2500 }];
    const after = [{ type: 'LOAD_REVENUE', referenceId: 'load-1', amount: 2500.01 }];

    expect(computeSettlementHash(before)).not.toBe(computeSettlementHash(after));
  });

  it('normalizes Decimal and number amounts to the same hash', () => {
    const fromNumber = [{ type: 'LOAD_REVENUE', referenceId: 'load-1', amount: 2500 }];
    const fromDecimal = [
      { type: 'LOAD_REVENUE', referenceId: 'load-1', amount: new Decimal('2500.00') },
    ];

    expect(computeSettlementHash(fromNumber)).toBe(computeSettlementHash(fromDecimal));
  });

  it('treats missing referenceId and null referenceId as equal', () => {
    const missing = [{ type: 'ADJUSTMENT', amount: 50 }];
    const nulled = [{ type: 'ADJUSTMENT', referenceId: null, amount: 50 }];

    expect(computeSettlementHash(missing)).toBe(computeSettlementHash(nulled));
  });
});
