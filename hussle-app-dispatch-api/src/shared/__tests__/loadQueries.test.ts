import { describe, expect, it } from '@jest/globals';
import Decimal from 'decimal.js';
import { computeMetrics } from '../loadQueries';

const buildMetricsLoad = (
  overrides: {
    customerRate?: Decimal | null;
    dispatchFee?: Decimal | null;
    ratePerMile?: Decimal | null;
    status?: string;
    carrier?: { type: string } | null;
  } = {},
) => ({
  customerRate: overrides.customerRate ?? null,
  dispatchFee: overrides.dispatchFee ?? null,
  ratePerMile: overrides.ratePerMile ?? null,
  status: overrides.status ?? 'BOOKED',
  carrier: overrides.carrier === undefined ? null : overrides.carrier,
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
        dispatchFee: new Decimal(150),
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
        dispatchFee: new Decimal(150),
        carrier: { type: 'EXTERNAL_CARRIER' },
      }),
      buildMetricsLoad({
        customerRate: new Decimal(1000),
        carrier: null,
      }),
    ];

    const result = computeMetrics(loads);

    expect(result.totalRevenue).toBe('3950.00');
  });

  it('uses customerRate for totalRevenue when carrier is LEASED_CARRIER', () => {
    const loads = [
      buildMetricsLoad({
        customerRate: new Decimal(2000),
        dispatchFee: new Decimal(200),
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
        dispatchFee: null,
        ratePerMile: null,
      }),
    ];

    const result = computeMetrics(loads);

    expect(result.totalGross).toBe('0.00');
    expect(result.totalRevenue).toBe('0.00');
    expect(result.avgRatePerMile).toBe('0.00');
  });

  it('calculates avgRatePerMile from non-null values only', () => {
    const loads = [
      buildMetricsLoad({ ratePerMile: new Decimal('3.50') }),
      buildMetricsLoad({ ratePerMile: null }),
      buildMetricsLoad({ ratePerMile: new Decimal('4.00') }),
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
