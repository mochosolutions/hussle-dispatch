import { DispatchFeeType, Prisma } from '@prisma/client';
import { computeDispatchFeeAmount, resolveDispatchFee } from '../resolveDispatchFee';

const buildCarrierFee = (
  overrides: Partial<{
    dispatchFeeType: DispatchFeeType;
    dispatchFeePercent: Prisma.Decimal;
    dispatchFeeAmount: Prisma.Decimal;
  }> = {},
) => ({
  dispatchFeeType: DispatchFeeType.PERCENTAGE,
  dispatchFeePercent: new Prisma.Decimal('15'),
  dispatchFeeAmount: new Prisma.Decimal('0'),
  ...overrides,
});

const buildLoadFee = (
  overrides: Partial<{
    dispatchFeeType: DispatchFeeType | null;
    dispatchFeeAmount: Prisma.Decimal | null;
  }> = {},
) => ({
  dispatchFeeType: null,
  dispatchFeeAmount: null,
  ...overrides,
});

describe('resolveDispatchFee', () => {
  it('uses load PERCENTAGE override when override type and amount provided', () => {
    const result = resolveDispatchFee({
      load: buildLoadFee({
        dispatchFeeType: DispatchFeeType.PERCENTAGE,
        dispatchFeeAmount: new Prisma.Decimal('20'),
      }),
      carrier: buildCarrierFee({
        dispatchFeeType: DispatchFeeType.FLAT,
        dispatchFeeAmount: new Prisma.Decimal('300'),
      }),
    });

    expect(result.type).toBe('PERCENTAGE');
    if (result.type === 'PERCENTAGE') {
      expect(result.percent.toString()).toBe('20');
    }
  });

  it('uses load FLAT override when override type and amount provided', () => {
    const result = resolveDispatchFee({
      load: buildLoadFee({
        dispatchFeeType: DispatchFeeType.FLAT,
        dispatchFeeAmount: new Prisma.Decimal('450'),
      }),
      carrier: buildCarrierFee({
        dispatchFeeType: DispatchFeeType.PERCENTAGE,
        dispatchFeePercent: new Prisma.Decimal('15'),
      }),
    });

    expect(result.type).toBe('FLAT');
    if (result.type === 'FLAT') {
      expect(result.amount.toString()).toBe('450');
    }
  });

  it('falls back to carrier PERCENTAGE when no load override', () => {
    const result = resolveDispatchFee({
      load: buildLoadFee(),
      carrier: buildCarrierFee({
        dispatchFeeType: DispatchFeeType.PERCENTAGE,
        dispatchFeePercent: new Prisma.Decimal('12.5'),
      }),
    });

    expect(result.type).toBe('PERCENTAGE');
    if (result.type === 'PERCENTAGE') {
      expect(result.percent.toString()).toBe('12.5');
    }
  });

  it('falls back to carrier FLAT when no load override', () => {
    const result = resolveDispatchFee({
      load: buildLoadFee(),
      carrier: buildCarrierFee({
        dispatchFeeType: DispatchFeeType.FLAT,
        dispatchFeeAmount: new Prisma.Decimal('275'),
      }),
    });

    expect(result.type).toBe('FLAT');
    if (result.type === 'FLAT') {
      expect(result.amount.toString()).toBe('275');
    }
  });
});

describe('computeDispatchFeeAmount', () => {
  it('computes 15% of 3200 as 480', () => {
    const result = computeDispatchFeeAmount({
      resolvedFee: { type: 'PERCENTAGE', percent: new Prisma.Decimal('15') },
      baseAmount: new Prisma.Decimal('3200'),
    });

    expect(result.toString()).toBe('480');
  });

  it('returns flat fee amount regardless of baseAmount', () => {
    const result = computeDispatchFeeAmount({
      resolvedFee: { type: 'FLAT', amount: new Prisma.Decimal('300') },
      baseAmount: new Prisma.Decimal('9999'),
    });

    expect(result.toString()).toBe('300');
  });
});
