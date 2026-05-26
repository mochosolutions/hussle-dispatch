import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import Decimal from 'decimal.js';
import { weeklyGrossQueryPrisma } from '../weeklyGrossQueryPrisma';

type MockFn = jest.Mock<(...args: never[]) => Promise<unknown>>;

const mockPrisma = {
  vehicle: {
    findUnique: jest.fn() as MockFn,
    findMany: jest.fn() as MockFn,
  },
  load: {
    aggregate: jest.fn() as MockFn,
    count: jest.fn() as MockFn,
    findMany: jest.fn() as MockFn,
  },
  orgSettings: {
    findUnique: jest.fn() as MockFn,
  },
};

const query = weeklyGrossQueryPrisma(
  mockPrisma as unknown as Parameters<typeof weeklyGrossQueryPrisma>[0],
);

describe('getWeeklyRevenue', () => {
  const weekStart = new Date('2026-03-25');
  const weekEnd = new Date('2026-03-31');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sums customerRate when vehicle carrier is COMPANY_ASSET', async () => {
    // Arrange
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      carrier: { type: 'COMPANY_ASSET' },
    });
    mockPrisma.load.count.mockResolvedValue(2);
    mockPrisma.load.aggregate.mockResolvedValue({
      _sum: { customerRate: new Decimal('5600.00') },
    });

    // Act
    const result = await query.getWeeklyRevenue('vehicle-1', weekStart, weekEnd);

    // Assert
    expect(result.revenue).toEqual(new Decimal('5600.00'));
    expect(result.loadCount).toBe(2);
    expect(mockPrisma.load.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ _sum: { customerRate: true } }),
    );
  });

  it('computes dispatchFee per load when vehicle carrier is EXTERNAL_CARRIER', async () => {
    // US-11b: dispatchFee is derived on-read from each Load's snapshot inputs
    // (dispatchFeeType + dispatchFeeAmount) instead of a Prisma _sum aggregate.
    // Arrange
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      carrier: { type: 'EXTERNAL_CARRIER' },
    });
    mockPrisma.load.count.mockResolvedValue(3);
    // 3 loads each with FLAT $150 dispatchFee → 450 total.
    const flatFeeLoad = {
      customerRate: new Decimal('1500'),
      loadedMiles: 100,
      totalMiles: 100,
      dispatchFeeType: 'FLAT' as const,
      dispatchFeeAmount: new Decimal('150'),
      partnerSplitPercent: null,
      driverPayType: null,
      driverPayRate: null,
      dispatcherCommissionType: null,
      dispatcherCommissionRate: null,
      feeIncludesAccessorials: false,
      payFromNet: false,
      carrierType: 'EXTERNAL_CARRIER' as const,
      accessorialCharges: [],
    };
    mockPrisma.load.findMany.mockResolvedValue([flatFeeLoad, flatFeeLoad, flatFeeLoad]);

    // Act
    const result = await query.getWeeklyRevenue('vehicle-1', weekStart, weekEnd);

    // Assert
    expect(result.revenue.toFixed(2)).toBe('450.00');
    expect(result.loadCount).toBe(3);
  });

  it('defaults to customerRate when vehicle has no carrier', async () => {
    // Arrange
    mockPrisma.vehicle.findUnique.mockResolvedValue({ carrier: null });
    mockPrisma.load.count.mockResolvedValue(1);
    mockPrisma.load.aggregate.mockResolvedValue({
      _sum: { customerRate: new Decimal('2800.00') },
    });

    // Act
    const result = await query.getWeeklyRevenue('vehicle-1', weekStart, weekEnd);

    // Assert
    expect(result.revenue).toEqual(new Decimal('2800.00'));
    expect(mockPrisma.load.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ _sum: { customerRate: true } }),
    );
  });

  it('returns zero revenue when no loads match', async () => {
    // Arrange
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      carrier: { type: 'COMPANY_ASSET' },
    });
    mockPrisma.load.count.mockResolvedValue(0);
    mockPrisma.load.aggregate.mockResolvedValue({
      _sum: { customerRate: null },
    });

    // Act
    const result = await query.getWeeklyRevenue('vehicle-1', weekStart, weekEnd);

    // Assert
    expect(result.revenue).toEqual(new Decimal(0));
    expect(result.loadCount).toBe(0);
  });
});
