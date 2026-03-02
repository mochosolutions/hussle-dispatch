import { calculateLoadFinancials } from '../financials';
import { OwnerOperatorNotSupportedError } from '../errors';
import { CARRIER_TYPES } from '../constants/carrierTypes';

describe('calculateLoadFinancials', () => {
  describe('COMPANY_ASSET carrier — basic fee without accessorials', () => {
    it('calculates dispatchFee, partnerSplit, companyShare with feeIncludesAccessorials=false', () => {
      // Arrange
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        carrier: {
          type: CARRIER_TYPES.COMPANY_ASSET,
          dispatchFeePercent: '10',
          partnerSplitPercent: '50',
          feeIncludesAccessorials: false,
        },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.dispatchFee).toBe('280.00');
      expect(result.partnerSplit).toBe('140.00');
      expect(result.companyShare).toBe('140.00');
    });

    it('returns customerRate and accessorials passthrough', () => {
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        carrier: {
          type: CARRIER_TYPES.COMPANY_ASSET,
          dispatchFeePercent: '10',
          partnerSplitPercent: '50',
          feeIncludesAccessorials: false,
        },
      };

      const result = calculateLoadFinancials(input);

      expect(result.customerRate).toBe('2800.00');
      expect(result.accessorials).toBe('0.00');
    });

    it('sets totalRevenue = customerRate + accessorials for COMPANY_ASSET', () => {
      const input = {
        customerRate: '2800.00',
        accessorials: '200.00',
        loadedMiles: 800,
        carrier: {
          type: CARRIER_TYPES.COMPANY_ASSET,
          dispatchFeePercent: '10',
          partnerSplitPercent: '50',
          feeIncludesAccessorials: false,
        },
      };

      const result = calculateLoadFinancials(input);

      expect(result.totalRevenue).toBe('3000.00');
    });
  });

  describe('COMPANY_ASSET carrier — fee includes accessorials', () => {
    it('calculates dispatchFee on (customerRate + accessorials) when feeIncludesAccessorials=true', () => {
      // Arrange
      const input = {
        customerRate: '2800.00',
        accessorials: '200.00',
        loadedMiles: 800,
        carrier: {
          type: CARRIER_TYPES.COMPANY_ASSET,
          dispatchFeePercent: '10',
          partnerSplitPercent: '50',
          feeIncludesAccessorials: true,
        },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.dispatchFee).toBe('300.00');
      expect(result.partnerSplit).toBe('150.00');
      expect(result.companyShare).toBe('150.00');
    });
  });

  describe('EXTERNAL_CARRIER carrier — totalRevenue = dispatchFee', () => {
    it('sets totalRevenue = dispatchFee for EXTERNAL_CARRIER', () => {
      // Arrange
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        carrier: {
          type: CARRIER_TYPES.EXTERNAL_CARRIER,
          dispatchFeePercent: '10',
          partnerSplitPercent: '50',
          feeIncludesAccessorials: false,
        },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.totalRevenue).toBe('280.00');
    });

    it('sets totalRevenue = dispatchFee (fee on full base) for EXTERNAL_CARRIER with feeIncludesAccessorials=true', () => {
      const input = {
        customerRate: '2800.00',
        accessorials: '200.00',
        loadedMiles: 800,
        carrier: {
          type: CARRIER_TYPES.EXTERNAL_CARRIER,
          dispatchFeePercent: '10',
          partnerSplitPercent: '50',
          feeIncludesAccessorials: true,
        },
      };

      const result = calculateLoadFinancials(input);

      expect(result.totalRevenue).toBe('300.00');
    });
  });

  describe('ratePerMile', () => {
    it('calculates ratePerMile when loadedMiles is provided', () => {
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        carrier: {
          type: CARRIER_TYPES.COMPANY_ASSET,
          dispatchFeePercent: '10',
          partnerSplitPercent: '50',
          feeIncludesAccessorials: false,
        },
      };

      const result = calculateLoadFinancials(input);

      expect(result.ratePerMile).toBe('3.50');
    });

    it('returns null when loadedMiles is null', () => {
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: null,
        carrier: {
          type: CARRIER_TYPES.COMPANY_ASSET,
          dispatchFeePercent: '10',
          partnerSplitPercent: '50',
          feeIncludesAccessorials: false,
        },
      };

      const result = calculateLoadFinancials(input);

      expect(result.ratePerMile).toBeNull();
    });

    it('returns null when loadedMiles is 0', () => {
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 0,
        carrier: {
          type: CARRIER_TYPES.COMPANY_ASSET,
          dispatchFeePercent: '10',
          partnerSplitPercent: '50',
          feeIncludesAccessorials: false,
        },
      };

      const result = calculateLoadFinancials(input);

      expect(result.ratePerMile).toBeNull();
    });
  });

  describe('OWNER_OPERATOR — typed error rejection', () => {
    it('throws OwnerOperatorNotSupportedError for OWNER_OPERATOR carrier type', () => {
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        carrier: {
          type: CARRIER_TYPES.OWNER_OPERATOR,
          dispatchFeePercent: '10',
          partnerSplitPercent: '50',
          feeIncludesAccessorials: false,
        },
      };

      expect(() => calculateLoadFinancials(input)).toThrow(
        OwnerOperatorNotSupportedError,
      );
    });

    it('error message says Not yet implemented', () => {
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        carrier: {
          type: CARRIER_TYPES.OWNER_OPERATOR,
          dispatchFeePercent: '10',
          partnerSplitPercent: '50',
          feeIncludesAccessorials: false,
        },
      };

      expect(() => calculateLoadFinancials(input)).toThrow(
        expect.objectContaining({ message: expect.stringContaining('not supported') }),
      );
    });
  });

  describe("banker's rounding (ROUND_HALF_EVEN)", () => {
    it('rounds 2.225 to 2.22 (half-to-even rounds down when preceding digit is even)', () => {
      // customerRate=2222.50, feePercent=10% => fee=222.25, partnerSplit=111.125
      // 111.125 rounded half-to-even: digit before 5 is 2 (even) → rounds down to 111.12
      const input = {
        customerRate: '2222.50',
        accessorials: '0.00',
        loadedMiles: null,
        carrier: {
          type: CARRIER_TYPES.COMPANY_ASSET,
          dispatchFeePercent: '10',
          partnerSplitPercent: '50',
          feeIncludesAccessorials: false,
        },
      };

      const result = calculateLoadFinancials(input);

      // dispatchFee = 2222.50 * 0.10 = 222.25 (exact)
      // partnerSplit = 222.25 * 0.50 = 111.125 → banker's rounds to 111.12 (2 is even)
      expect(result.dispatchFee).toBe('222.25');
      expect(result.partnerSplit).toBe('111.12');
      expect(result.companyShare).toBe('111.13');
    });

    it('rounds 2.235 to 2.24 (half-to-even rounds up when preceding digit is odd)', () => {
      // customerRate=2235.00, feePercent=10% => fee=223.50, partnerSplit=111.75
      // Need a case where partnerSplit ends in .X35 — use partnerSplitPercent=50
      // customerRate=447.00, fee=10% => 44.70, partnerSplit=22.35 (exact, no rounding)
      // Use customerRate=447.10, fee=10% => 44.71, partnerSplit=22.355 → 22.36 (5 is odd)
      const input = {
        customerRate: '447.10',
        accessorials: '0.00',
        loadedMiles: null,
        carrier: {
          type: CARRIER_TYPES.COMPANY_ASSET,
          dispatchFeePercent: '10',
          partnerSplitPercent: '50',
          feeIncludesAccessorials: false,
        },
      };

      const result = calculateLoadFinancials(input);

      // dispatchFee = 447.10 * 0.10 = 44.71 (exact)
      // partnerSplit = 44.71 * 0.50 = 22.355 → banker's rounds to 22.36 (3 is odd → round up)
      expect(result.dispatchFee).toBe('44.71');
      expect(result.partnerSplit).toBe('22.36');
      expect(result.companyShare).toBe('22.35');
    });
  });

  describe('return shape', () => {
    it('returns all required fields as strings with 2 decimal places', () => {
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        carrier: {
          type: CARRIER_TYPES.COMPANY_ASSET,
          dispatchFeePercent: '10',
          partnerSplitPercent: '50',
          feeIncludesAccessorials: false,
        },
      };

      const result = calculateLoadFinancials(input);

      expect(typeof result.customerRate).toBe('string');
      expect(typeof result.accessorials).toBe('string');
      expect(typeof result.dispatchFee).toBe('string');
      expect(typeof result.partnerSplit).toBe('string');
      expect(typeof result.companyShare).toBe('string');
      expect(typeof result.totalRevenue).toBe('string');
      expect(typeof result.ratePerMile).toBe('string');
    });
  });
});
