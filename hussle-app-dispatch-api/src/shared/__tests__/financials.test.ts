import { calculateLoadFinancials } from '../financials';
import type { CarrierInput } from '../financials';
import { CARRIER_TYPES } from '../constants/carrierTypes';

describe('calculateLoadFinancials', () => {
  const baseCarrier: Omit<CarrierInput, 'type'> = {
    dispatchFeePercent: '10',
    partnerSplitPercent: '50',
    feeIncludesAccessorials: false,
    feeType: 'PER_LOAD_PERCENT',
    payFromNet: false,
  };

  describe('COMPANY_ASSET carrier — basic fee without accessorials', () => {
    it('calculates dispatchFee, partnerSplit, companyShare with feeIncludesAccessorials=false', () => {
      // Arrange
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.dispatchFee).toBe('280.00');
      expect(result.partnerSplit).toBe('1400.00');
      expect(result.companyShare).toBe('-1120.00');
    });

    it('returns customerRate and accessorials passthrough', () => {
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
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
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
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
        totalMiles: 800,
        carrier: {
          ...baseCarrier,
          type: CARRIER_TYPES.COMPANY_ASSET,
          feeIncludesAccessorials: true,
        },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.dispatchFee).toBe('300.00');
      expect(result.partnerSplit).toBe('1500.00');
      expect(result.companyShare).toBe('-1200.00');
    });
  });

  describe('EXTERNAL_CARRIER carrier — totalRevenue = dispatchFee', () => {
    it('sets totalRevenue = dispatchFee for EXTERNAL_CARRIER', () => {
      // Arrange
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.EXTERNAL_CARRIER },
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
        totalMiles: 800,
        carrier: {
          ...baseCarrier,
          type: CARRIER_TYPES.EXTERNAL_CARRIER,
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
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
      };

      const result = calculateLoadFinancials(input);

      expect(result.ratePerMile).toBe('3.50');
    });

    it('returns null when loadedMiles is null', () => {
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: null,
        totalMiles: null,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
      };

      const result = calculateLoadFinancials(input);

      expect(result.ratePerMile).toBeNull();
    });

    it('returns null when loadedMiles is 0', () => {
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 0,
        totalMiles: 0,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
      };

      const result = calculateLoadFinancials(input);

      expect(result.ratePerMile).toBeNull();
    });
  });

  describe("banker's rounding (ROUND_HALF_EVEN)", () => {
    it('rounds 2.225 to 2.22 (half-to-even rounds down when preceding digit is even)', () => {
      // customerRate=2222.50, feePercent=10% => fee=222.25
      // partnerSplit = (2222.50 + 0) x 0.50 = 1111.25 (exact, no rounding needed)
      const input = {
        customerRate: '2222.50',
        accessorials: '0.00',
        loadedMiles: null,
        totalMiles: null,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
      };

      const result = calculateLoadFinancials(input);

      // dispatchFee = 2222.50 * 0.10 = 222.25 (exact)
      // partnerSplit = (2222.50 + 0) * 0.50 = 1111.25 (exact)
      // companyShare = 222.25 - 1111.25 = -889.00
      expect(result.dispatchFee).toBe('222.25');
      expect(result.partnerSplit).toBe('1111.25');
      expect(result.companyShare).toBe('-889.00');
    });

    it('rounds 2.235 to 2.24 (half-to-even rounds up when preceding digit is odd)', () => {
      // customerRate=447.10, feePercent=10% => fee=44.71
      // partnerSplit = (447.10 + 0) x 0.50 = 223.55 (exact, no rounding needed)
      const input = {
        customerRate: '447.10',
        accessorials: '0.00',
        loadedMiles: null,
        totalMiles: null,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
      };

      const result = calculateLoadFinancials(input);

      // dispatchFee = 447.10 * 0.10 = 44.71 (exact)
      // partnerSplit = (447.10 + 0) * 0.50 = 223.55 (exact)
      // companyShare = 44.71 - 223.55 = -178.84
      expect(result.dispatchFee).toBe('44.71');
      expect(result.partnerSplit).toBe('223.55');
      expect(result.companyShare).toBe('-178.84');
    });
  });

  describe('return shape', () => {
    it('returns all required fields as strings with 2 decimal places', () => {
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
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

  describe('LEASED_CARRIER — totalRevenue = companyMargin', () => {
    it('sets totalRevenue = companyMargin (same as EXTERNAL_CARRIER)', () => {
      // Arrange
      // customerRate=2800, dispatchFeePercent=15%, feeIncludesAccessorials=false
      // dispatchFee = 2800 * 0.15 = 420.00
      // totalRevenue should = 420.00 (= companyMargin = dispatchFee)
      // carrierPayout = 2800 - 420 = 2380.00
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: {
          ...baseCarrier,
          type: CARRIER_TYPES.LEASED_CARRIER,
          dispatchFeePercent: '15',
        },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.totalRevenue).toBe('420.00');
      expect(result.companyMargin).toBe('420.00');
      expect(result.carrierPayout).toBe('2380.00');
    });
  });

  describe('driverPay — PERCENTAGE', () => {
    it('calculates driverPay as percentage of carrierPayout', () => {
      // Arrange
      // dispatchFeePercent=10%, gross=2800, companyMargin=280
      // carrierPayout = 2800 - 280 = 2520
      // driverPay = 2520 * 50/100 = 1260.00
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
        driverPay: { payType: 'PERCENTAGE', payRate: '50' },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.driverPay).toBe('1260.00');
    });

    it('uses payFromNet base when payFromNet=true and estimatedCost available', () => {
      // Arrange
      // carrierPayout=2520, vehicleCpm=1.85, totalMiles=800
      // estimatedCost = 1.85 * 800 = 1480.00
      // payBase = 2520 - 1480 = 1040
      // driverPay = 1040 * 50/100 = 520.00
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: {
          ...baseCarrier,
          type: CARRIER_TYPES.COMPANY_ASSET,
          payFromNet: true,
        },
        vehicleCpm: 1.85,
        driverPay: { payType: 'PERCENTAGE', payRate: '50' },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.estimatedCost).toBe('1480.00');
      expect(result.driverPay).toBe('520.00');
    });
  });

  describe('driverPay — PER_MILE', () => {
    it('calculates driverPay = payRate × loadedMiles', () => {
      // Arrange
      // payRate=0.60, loadedMiles=800 → driverPay=480.00
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
        driverPay: { payType: 'PER_MILE', payRate: '0.60' },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.driverPay).toBe('480.00');
    });

    it('returns null when loadedMiles is null', () => {
      // Arrange
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: null,
        totalMiles: null,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
        driverPay: { payType: 'PER_MILE', payRate: '0.60' },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.driverPay).toBeNull();
    });
  });

  describe('driverPay — PER_HOUR', () => {
    it('calculates driverPay = payRate × estimatedHours', () => {
      // Arrange
      // payRate=25.00, estimatedHours=12 → driverPay=300.00
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
        driverPay: { payType: 'PER_HOUR', payRate: '25.00', estimatedHours: 12 },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.driverPay).toBe('300.00');
    });

    it('returns null when estimatedHours is not provided', () => {
      // Arrange
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
        driverPay: { payType: 'PER_HOUR', payRate: '25.00' },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.driverPay).toBeNull();
    });
  });

  describe('driverPay — FLAT_RATE', () => {
    it('returns payRate as driverPay', () => {
      // Arrange
      // payRate=500 → driverPay=500.00
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
        driverPay: { payType: 'FLAT_RATE', payRate: '500' },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.driverPay).toBe('500.00');
    });
  });

  describe('dispatcherComm — PERCENTAGE_OF_MARGIN', () => {
    it('calculates commission as percentage of companyMargin', () => {
      // Arrange
      // dispatchFeePercent=10%, gross=2800, companyMargin=280
      // commissionRate=10% → dispatcherComm = 280 * 10/100 = 28.00
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
        dispatcherComm: { commissionType: 'PERCENTAGE_OF_MARGIN', commissionRate: '10' },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.dispatcherComm).toBe('28.00');
    });
  });

  describe('dispatcherComm — PERCENTAGE_OF_GROSS', () => {
    it('calculates commission as percentage of gross revenue', () => {
      // Arrange
      // gross=2800, commissionRate=5% → dispatcherComm = 2800 * 5/100 = 140.00
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
        dispatcherComm: { commissionType: 'PERCENTAGE_OF_GROSS', commissionRate: '5' },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.dispatcherComm).toBe('140.00');
    });
  });

  describe('dispatcherComm — FLAT_PER_LOAD', () => {
    it('returns commissionRate as flat dollar amount', () => {
      // Arrange
      // commissionRate=50 → dispatcherComm=50.00
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
        dispatcherComm: { commissionType: 'FLAT_PER_LOAD', commissionRate: '50' },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.dispatcherComm).toBe('50.00');
    });
  });

  describe('companyNet', () => {
    it('calculates companyNet = companyMargin - dispatcherComm', () => {
      // Arrange
      // companyMargin=280 (10% of 2800), dispatcherComm=28 (10% of 280)
      // companyNet = 280 - 28 = 252.00
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
        dispatcherComm: { commissionType: 'PERCENTAGE_OF_MARGIN', commissionRate: '10' },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.companyNet).toBe('252.00');
    });

    it('returns null when no dispatcher commission provided', () => {
      // Arrange
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.companyNet).toBeNull();
    });
  });

  describe('estimatedCost', () => {
    it('calculates estimatedCost = vehicleCpm × totalMiles', () => {
      // Arrange
      // vehicleCpm=1.85, totalMiles=800 → estimatedCost=1480.00
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
        vehicleCpm: 1.85,
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.estimatedCost).toBe('1480.00');
    });

    it('returns null when vehicleCpm is not provided', () => {
      // Arrange
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.estimatedCost).toBeNull();
    });

    it('returns null when totalMiles is null', () => {
      // Arrange
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: null,
        totalMiles: null,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
        vehicleCpm: 1.85,
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.estimatedCost).toBeNull();
    });
  });

  describe('carrierPayoutOverride', () => {
    it('uses override value instead of computed carrierPayout', () => {
      // Arrange
      // Without override: carrierPayout = 2800 - 280 = 2520
      // With override=2500.00 → carrierPayout=2500.00
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: { ...baseCarrier, type: CARRIER_TYPES.COMPANY_ASSET },
        carrierPayoutOverride: '2500.00',
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.carrierPayout).toBe('2500.00');
    });
  });

  describe('COMPANY_ASSET with 0% dispatch fee', () => {
    it('companyMargin = 0, carrierPayout = gross, totalRevenue = gross', () => {
      // Arrange
      // dispatchFeePercent=0 → companyMargin=0.00, carrierPayout=2800.00, totalRevenue=2800.00
      const input = {
        customerRate: '2800.00',
        accessorials: '0.00',
        loadedMiles: 800,
        totalMiles: 800,
        carrier: {
          ...baseCarrier,
          type: CARRIER_TYPES.COMPANY_ASSET,
          dispatchFeePercent: '0',
        },
      };

      // Act
      const result = calculateLoadFinancials(input);

      // Assert
      expect(result.companyMargin).toBe('0.00');
      expect(result.carrierPayout).toBe('2800.00');
      expect(result.totalRevenue).toBe('2800.00');
    });
  });
});
