import { describe, expect, it } from '@jest/globals';
import Decimal from 'decimal.js';
import { computeMetrics, type MetricsLoad } from '../loadQueries';

// US-11b: computeMetrics consumes per-row compute. Fixtures must provide the
// snapshot inputs (customerRate, loadedMiles, dispatchFeeType/Amount) plus
// carrier type and accessorialCharges so dispatchFee / ratePerMile are derived
// rather than read from the (removed) persisted cache columns.
const buildMetricsLoad = (
  overrides: {
    customerRate?: Decimal | null;
    loadedMiles?: number | null;
    dispatchFeeType?: 'PERCENTAGE' | 'FLAT' | null;
    dispatchFeeAmount?: Decimal | null;
    status?: string;
    carrier?: { type: string } | null;
  } = {},
): MetricsLoad => ({
  customerRate: (overrides.customerRate ?? null) as MetricsLoad['customerRate'],
  loadedMiles: overrides.loadedMiles ?? null,
  totalMiles: null,
  dispatchFeeType: overrides.dispatchFeeType ?? null,
  dispatchFeeAmount: (overrides.dispatchFeeAmount ?? null) as MetricsLoad['dispatchFeeAmount'],
  partnerSplitPercent: null,
  driverPayType: null,
  driverPayRate: null,
  dispatcherCommissionType: null,
  dispatcherCommissionRate: null,
  feeIncludesAccessorials: null,
  payFromNet: null,
  carrierType: null,
  status: overrides.status ?? 'BOOKED',
  carrier: overrides.carrier === undefined ? null : overrides.carrier,
  accessorialCharges: [],
});

describe('computeMetrics', () => {
  it('sums customerRate as totalGross for all loads regardless of carrier type', () => {
    const loads = [
      buildMetricsLoad({
        customerRate: new Decimal(2800),
        carrier: { type: 'COMPANY_ASSET' },
      }),
      buildMetricsLoad({
        customerRate: new Decimal(1500),
        dispatchFeeType: 'FLAT',
        dispatchFeeAmount: new Decimal(150),
        carrier: { type: 'EXTERNAL_CARRIER' },
      }),
      buildMetricsLoad({
        customerRate: new Decimal(1000),
        carrier: null,
      }),
    ];

    const result = computeMetrics(loads);

    expect(result.totalGross).toBe('5300.00');
  });

  it('calculates carrier-type-aware totalRevenue for mixed fleet', () => {
    const loads = [
      buildMetricsLoad({
        customerRate: new Decimal(2800),
        carrier: { type: 'COMPANY_ASSET' },
      }),
      buildMetricsLoad({
        customerRate: new Decimal(1500),
        dispatchFeeType: 'FLAT',
        dispatchFeeAmount: new Decimal(150),
        carrier: { type: 'EXTERNAL_CARRIER' },
      }),
      buildMetricsLoad({
        customerRate: new Decimal(1000),
        carrier: null,
      }),
    ];

    const result = computeMetrics(loads);

    // 2800 (COMPANY_ASSET, customerRate) + 150 (EXTERNAL, FLAT dispatchFee)
    // + 1000 (null carrier, customerRate) = 3950
    expect(result.totalRevenue).toBe('3950.00');
  });

  it('uses customerRate for totalRevenue when carrier is LEASED_CARRIER', () => {
    const loads = [
      buildMetricsLoad({
        customerRate: new Decimal(2000),
        dispatchFeeType: 'FLAT',
        dispatchFeeAmount: new Decimal(200),
        carrier: { type: 'LEASED_CARRIER' },
      }),
    ];

    const result = computeMetrics(loads);

    // LEASED_CARRIER runs on our authority — revenue = customerRate, not dispatchFee
    expect(result.totalRevenue).toBe('2000.00');
  });

  it('uses customerRate for loads with null carrier', () => {
    const loads = [
      buildMetricsLoad({
        customerRate: new Decimal(500),
        carrier: null,
      }),
    ];

    const result = computeMetrics(loads);

    expect(result.totalGross).toBe('500.00');
    expect(result.totalRevenue).toBe('500.00');
  });

  it('returns zero for all null financial fields', () => {
    const loads = [
      buildMetricsLoad({
        customerRate: null,
      }),
    ];

    const result = computeMetrics(loads);

    expect(result.totalGross).toBe('0.00');
    expect(result.totalRevenue).toBe('0.00');
    expect(result.avgRatePerMile).toBe('0.00');
  });

  it('calculates avgRatePerMile from per-row compute (customerRate / loadedMiles)', () => {
    // ratePerMile is derived per row from customerRate / loadedMiles.
    // Load 1: 3500 / 1000 = 3.50
    // Load 2: no loadedMiles → contributes null (excluded)
    // Load 3: 4000 / 1000 = 4.00
    // Average of [3.50, 4.00] = 3.75
    const loads = [
      buildMetricsLoad({ customerRate: new Decimal(3500), loadedMiles: 1000 }),
      buildMetricsLoad({ customerRate: new Decimal(2000) }),
      buildMetricsLoad({ customerRate: new Decimal(4000), loadedMiles: 1000 }),
    ];

    const result = computeMetrics(loads);

    expect(result.avgRatePerMile).toBe('3.75');
  });

  it('calculates onTimePercent from delivered statuses', () => {
    const loads = [
      buildMetricsLoad({ status: 'DELIVERED' }),
      buildMetricsLoad({ status: 'INVOICED' }),
      buildMetricsLoad({ status: 'BOOKED' }),
      buildMetricsLoad({ status: 'DISPATCHED' }),
    ];

    const result = computeMetrics(loads);

    expect(result.onTimePercent).toBe('50.0');
  });
});
