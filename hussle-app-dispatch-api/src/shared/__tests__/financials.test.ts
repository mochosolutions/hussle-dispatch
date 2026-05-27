import { describe, expect, it } from '@jest/globals';
import Decimal from 'decimal.js';
import { calculateLoadFinancials } from '../financials';
import type { LoadFinancialsInput } from '../financials';
import { CARRIER_TYPES } from '../constants/carrierTypes';

// ---------------------------------------------------------------------------
// Base input — US-10 flat shape; only the snapshot columns + miles + customer
// rate are required. carrierType is still required because totalRevenue branches
// on it.
// ---------------------------------------------------------------------------

const baseInput = (overrides?: Partial<LoadFinancialsInput>): LoadFinancialsInput => ({
  customerRate: '2800.00',
  loadedMiles: 800,
  totalMiles: 800,
  dispatchFeeType: 'PERCENTAGE',
  dispatchFeeAmount: '10',
  partnerSplitPercent: '50',
  driverPayType: null,
  driverPayRate: null,
  dispatcherCommissionType: null,
  dispatcherCommissionRate: null,
  feeIncludesAccessorials: false,
  payFromNet: false,
  carrierType: CARRIER_TYPES.COMPANY_ASSET,
  ...overrides,
});

const ZERO = new Decimal(0);

describe('calculateLoadFinancials', () => {
  describe('COMPANY_ASSET carrier — basic fee without accessorials', () => {
    it('calculates dispatchFee, partnerSplit, companyShare with feeIncludesAccessorials=false', () => {
      const result = calculateLoadFinancials(baseInput(), ZERO);

      expect(result.dispatchFee).toBe('280.00');
      expect(result.partnerSplit).toBe('1400.00');
      expect(result.companyShare).toBe('-1120.00');
    });

    it('returns customerRate and accessorials passthrough', () => {
      const result = calculateLoadFinancials(baseInput(), ZERO);

      expect(result.customerRate).toBe('2800.00');
      expect(result.accessorials).toBe('0.00');
    });

    it('sets totalRevenue = customerRate + accessorials for COMPANY_ASSET', () => {
      const result = calculateLoadFinancials(baseInput(), new Decimal('200.00'));

      expect(result.totalRevenue).toBe('3000.00');
    });
  });

  describe('COMPANY_ASSET carrier — fee includes accessorials', () => {
    it('calculates dispatchFee on (customerRate + accessorials) when feeIncludesAccessorials=true', () => {
      const result = calculateLoadFinancials(
        baseInput({ feeIncludesAccessorials: true }),
        new Decimal('200.00'),
      );

      expect(result.dispatchFee).toBe('300.00');
      expect(result.partnerSplit).toBe('1500.00');
      expect(result.companyShare).toBe('-1200.00');
    });
  });

  describe('EXTERNAL_CARRIER carrier — totalRevenue = dispatchFee', () => {
    it('sets totalRevenue = dispatchFee for EXTERNAL_CARRIER', () => {
      const result = calculateLoadFinancials(
        baseInput({ carrierType: CARRIER_TYPES.EXTERNAL_CARRIER }),
        ZERO,
      );

      expect(result.totalRevenue).toBe('280.00');
    });

    it('sets totalRevenue = dispatchFee (fee on full base) for EXTERNAL_CARRIER with feeIncludesAccessorials=true', () => {
      const result = calculateLoadFinancials(
        baseInput({
          carrierType: CARRIER_TYPES.EXTERNAL_CARRIER,
          feeIncludesAccessorials: true,
        }),
        new Decimal('200.00'),
      );

      expect(result.totalRevenue).toBe('300.00');
    });
  });

  describe('ratePerMile', () => {
    it('calculates ratePerMile when loadedMiles is provided', () => {
      const result = calculateLoadFinancials(baseInput(), ZERO);

      expect(result.ratePerMile).toBe('3.50');
    });

    it('returns null when loadedMiles is null', () => {
      const result = calculateLoadFinancials(
        baseInput({ loadedMiles: null, totalMiles: null }),
        ZERO,
      );

      expect(result.ratePerMile).toBeNull();
    });

    it('returns null when loadedMiles is 0', () => {
      const result = calculateLoadFinancials(
        baseInput({ loadedMiles: 0, totalMiles: 0 }),
        ZERO,
      );

      expect(result.ratePerMile).toBeNull();
    });
  });

  describe("banker's rounding (ROUND_HALF_EVEN)", () => {
    it('rounds correctly with exact partner split calculations (2222.50)', () => {
      const result = calculateLoadFinancials(
        baseInput({ customerRate: '2222.50', loadedMiles: null, totalMiles: null }),
        ZERO,
      );

      expect(result.dispatchFee).toBe('222.25');
      expect(result.partnerSplit).toBe('1111.25');
      expect(result.companyShare).toBe('-889.00');
    });

    it('rounds correctly with exact partner split calculations (447.10)', () => {
      const result = calculateLoadFinancials(
        baseInput({ customerRate: '447.10', loadedMiles: null, totalMiles: null }),
        ZERO,
      );

      expect(result.dispatchFee).toBe('44.71');
      expect(result.partnerSplit).toBe('223.55');
      expect(result.companyShare).toBe('-178.84');
    });
  });

  describe('return shape', () => {
    it('returns all required fields as strings with 2 decimal places', () => {
      const result = calculateLoadFinancials(baseInput(), ZERO);

      expect(typeof result.customerRate).toBe('string');
      expect(typeof result.accessorials).toBe('string');
      expect(typeof result.dispatchFee).toBe('string');
      expect(typeof result.partnerSplit).toBe('string');
      expect(typeof result.companyShare).toBe('string');
      expect(typeof result.totalRevenue).toBe('string');
      expect(typeof result.ratePerMile).toBe('string');
    });
  });

  describe('LEASED_CARRIER — totalRevenue = companyMargin', () => {
    it('sets totalRevenue = companyMargin (same as EXTERNAL_CARRIER)', () => {
      const result = calculateLoadFinancials(
        baseInput({
          carrierType: CARRIER_TYPES.LEASED_CARRIER,
          dispatchFeeAmount: '15',
        }),
        ZERO,
      );

      expect(result.totalRevenue).toBe('420.00');
      expect(result.companyMargin).toBe('420.00');
      expect(result.carrierPayout).toBe('2380.00');
    });
  });

  describe('driverPay — PERCENTAGE', () => {
    it('calculates driverPay as percentage of carrierPayout', () => {
      const result = calculateLoadFinancials(
        baseInput({ driverPayType: 'PERCENTAGE', driverPayRate: '50' }),
        ZERO,
      );

      // carrierPayout=2520, 50% → 1260
      expect(result.driverPay).toBe('1260.00');
    });

    it('uses payFromNet base when payFromNet=true and estimatedCost available', () => {
      const result = calculateLoadFinancials(
        baseInput({
          payFromNet: true,
          vehicleCpm: 1.85,
          driverPayType: 'PERCENTAGE',
          driverPayRate: '50',
        }),
        ZERO,
      );

      // estimatedCost = 1.85 * 800 = 1480; payBase = 2520 - 1480 = 1040; 50% → 520
      expect(result.estimatedCost).toBe('1480.00');
      expect(result.driverPay).toBe('520.00');
    });
  });

  describe('driverPay — PER_MILE', () => {
    it('calculates driverPay = payRate × loadedMiles', () => {
      const result = calculateLoadFinancials(
        baseInput({ driverPayType: 'PER_MILE', driverPayRate: '0.60' }),
        ZERO,
      );

      expect(result.driverPay).toBe('480.00');
    });

    it('returns null when loadedMiles is null', () => {
      const result = calculateLoadFinancials(
        baseInput({
          loadedMiles: null,
          totalMiles: null,
          driverPayType: 'PER_MILE',
          driverPayRate: '0.60',
        }),
        ZERO,
      );

      expect(result.driverPay).toBeNull();
    });
  });

  describe('driverPay — PER_HOUR', () => {
    it('calculates driverPay = payRate × estimatedHours', () => {
      const result = calculateLoadFinancials(
        baseInput({
          driverPayType: 'PER_HOUR',
          driverPayRate: '25.00',
          estimatedHours: 12,
        }),
        ZERO,
      );

      expect(result.driverPay).toBe('300.00');
    });

    it('returns null when estimatedHours is not provided', () => {
      const result = calculateLoadFinancials(
        baseInput({ driverPayType: 'PER_HOUR', driverPayRate: '25.00' }),
        ZERO,
      );

      expect(result.driverPay).toBeNull();
    });
  });

  describe('driverPay — FLAT_RATE', () => {
    it('returns payRate as driverPay', () => {
      const result = calculateLoadFinancials(
        baseInput({ driverPayType: 'FLAT_RATE', driverPayRate: '500' }),
        ZERO,
      );

      expect(result.driverPay).toBe('500.00');
    });
  });

  describe('dispatcherComm — PERCENTAGE_OF_MARGIN', () => {
    it('calculates commission as percentage of companyMargin', () => {
      const result = calculateLoadFinancials(
        baseInput({
          dispatcherCommissionType: 'PERCENTAGE_OF_MARGIN',
          dispatcherCommissionRate: '10',
        }),
        ZERO,
      );

      expect(result.dispatcherComm).toBe('28.00');
    });
  });

  describe('dispatcherComm — PERCENTAGE_OF_GROSS', () => {
    it('calculates commission as percentage of gross revenue', () => {
      const result = calculateLoadFinancials(
        baseInput({
          dispatcherCommissionType: 'PERCENTAGE_OF_GROSS',
          dispatcherCommissionRate: '5',
        }),
        ZERO,
      );

      expect(result.dispatcherComm).toBe('140.00');
    });
  });

  describe('dispatcherComm — FLAT_PER_LOAD', () => {
    it('returns commissionRate as flat dollar amount', () => {
      const result = calculateLoadFinancials(
        baseInput({
          dispatcherCommissionType: 'FLAT_PER_LOAD',
          dispatcherCommissionRate: '50',
        }),
        ZERO,
      );

      expect(result.dispatcherComm).toBe('50.00');
    });
  });

  describe('companyNet', () => {
    it('calculates companyNet = companyMargin - dispatcherComm', () => {
      const result = calculateLoadFinancials(
        baseInput({
          dispatcherCommissionType: 'PERCENTAGE_OF_MARGIN',
          dispatcherCommissionRate: '10',
        }),
        ZERO,
      );

      expect(result.companyNet).toBe('252.00');
    });

    it('returns null when no dispatcher commission provided', () => {
      const result = calculateLoadFinancials(baseInput(), ZERO);

      expect(result.companyNet).toBeNull();
    });
  });

  describe('estimatedCost', () => {
    it('calculates estimatedCost = vehicleCpm × totalMiles', () => {
      const result = calculateLoadFinancials(baseInput({ vehicleCpm: 1.85 }), ZERO);

      expect(result.estimatedCost).toBe('1480.00');
    });

    it('returns null when vehicleCpm is not provided', () => {
      const result = calculateLoadFinancials(baseInput(), ZERO);

      expect(result.estimatedCost).toBeNull();
    });

    it('returns null when totalMiles is null', () => {
      const result = calculateLoadFinancials(
        baseInput({ loadedMiles: null, totalMiles: null, vehicleCpm: 1.85 }),
        ZERO,
      );

      expect(result.estimatedCost).toBeNull();
    });
  });

  describe('carrierPayoutOverride', () => {
    it('uses override value instead of computed carrierPayout', () => {
      const result = calculateLoadFinancials(
        baseInput({ carrierPayoutOverride: '2500.00' }),
        ZERO,
      );

      expect(result.carrierPayout).toBe('2500.00');
    });
  });

  describe('COMPANY_ASSET with 0% dispatch fee', () => {
    it('companyMargin = 0, carrierPayout = gross, totalRevenue = gross', () => {
      const result = calculateLoadFinancials(baseInput({ dispatchFeeAmount: '0' }), ZERO);

      expect(result.companyMargin).toBe('0.00');
      expect(result.carrierPayout).toBe('2800.00');
      expect(result.totalRevenue).toBe('2800.00');
    });
  });

  // -------------------------------------------------------------------------
  // US-10 null-input semantics (truths #2–#7)
  // -------------------------------------------------------------------------

  describe('US-10 null-input semantics', () => {
    it('returns driverPay=null (zero conceptually) when driverPayRate is null', () => {
      const result = calculateLoadFinancials(
        baseInput({ driverPayType: 'PERCENTAGE', driverPayRate: null }),
        ZERO,
      );

      expect(result.driverPay).toBeNull();
    });

    it('returns dispatcherComm=null when dispatcherCommissionRate is null', () => {
      const result = calculateLoadFinancials(
        baseInput({
          dispatcherCommissionType: 'PERCENTAGE_OF_MARGIN',
          dispatcherCommissionRate: null,
        }),
        ZERO,
      );

      expect(result.dispatcherComm).toBeNull();
    });

    it('returns dispatchFee=0.00 when dispatchFeeType is null', () => {
      const result = calculateLoadFinancials(
        baseInput({ dispatchFeeType: null, dispatchFeeAmount: null }),
        ZERO,
      );

      expect(result.dispatchFee).toBe('0.00');
      expect(result.companyMargin).toBe('0.00');
    });

    it('returns partnerSplit=0.00 when partnerSplitPercent is null', () => {
      const result = calculateLoadFinancials(
        baseInput({ partnerSplitPercent: null }),
        ZERO,
      );

      expect(result.partnerSplit).toBe('0.00');
    });

    it('treats feeIncludesAccessorials=null as false', () => {
      const result = calculateLoadFinancials(
        baseInput({ feeIncludesAccessorials: null }),
        new Decimal('200.00'),
      );

      // feeBase = customerRate only (false) → 2800 * 0.10 = 280
      expect(result.dispatchFee).toBe('280.00');
    });

    it('treats payFromNet=null as false (driverPay PERCENTAGE base = carrierPayout)', () => {
      const result = calculateLoadFinancials(
        baseInput({
          payFromNet: null,
          driverPayType: 'PERCENTAGE',
          driverPayRate: '50',
          vehicleCpm: 1.85,
        }),
        ZERO,
      );

      // payFromNet null → false → payBase = carrierPayout (2520) → 50% → 1260
      expect(result.driverPay).toBe('1260.00');
    });

    it('respects feeIncludesAccessorials=true on Load (not Carrier) — input drives the calc', () => {
      // This is the pure-function equivalent of truth #6: input shape itself is
      // the contract; the function reads only its inputs.
      const result = calculateLoadFinancials(
        baseInput({ feeIncludesAccessorials: true }),
        new Decimal('200.00'),
      );

      // feeBase = 3000 → 300
      expect(result.dispatchFee).toBe('300.00');
    });

    it('respects payFromNet=true on Load (not Carrier) — input drives the calc', () => {
      // Truth #7 pure-function equivalent.
      const result = calculateLoadFinancials(
        baseInput({
          payFromNet: true,
          vehicleCpm: 1.85,
          driverPayType: 'PERCENTAGE',
          driverPayRate: '50',
        }),
        ZERO,
      );

      // estimatedCost = 1480; payBase = 2520 - 1480 = 1040; 50% → 520
      expect(result.driverPay).toBe('520.00');
    });

    it('handles FLAT dispatchFeeType — uses dispatchFeeAmount directly', () => {
      const result = calculateLoadFinancials(
        baseInput({ dispatchFeeType: 'FLAT', dispatchFeeAmount: '350.00' }),
        ZERO,
      );

      expect(result.dispatchFee).toBe('350.00');
    });
  });
});
