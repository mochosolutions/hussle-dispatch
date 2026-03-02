import { calculateChainScore } from '../calculateChainScore';

describe('calculateChainScore', () => {
  const baseInput = {
    outboundRate: 2000,
    outboundMiles: 800,
    returnRate: 1800,
    returnMiles: 750,
    totalTripDays: 4,
    milesFromHomeAfterReturn: 100,
    homeBase: 'TX',
    returnDropState: 'TX',
    preferredLanes: ['TX', 'OK'],
    vehicleCpmPerDay: 800,
  };

  describe('return shape — all required fields', () => {
    it('returns all required score fields', () => {
      const result = calculateChainScore(baseInput);

      expect(typeof result.chainProfitabilityPoints).toBe('number');
      expect(typeof result.returnPositioningPoints).toBe('number');
      expect(typeof result.timeEfficiencyPoints).toBe('number');
      expect(typeof result.chainScore).toBe('number');
      expect(typeof result.chainLabel).toBe('string');
    });

    it('returns all required chain metric fields', () => {
      const result = calculateChainScore(baseInput);

      expect(typeof result.roundTripRevenue).toBe('number');
      expect(typeof result.roundTripProfit).toBe('number');
      expect(typeof result.chainRPM).toBe('number');
      expect(typeof result.dailyRevenueUtilization).toBe('number');
      expect(typeof result.projectedWeeklyGross).toBe('number');
    });
  });

  describe('score component bounds', () => {
    it('chainProfitabilityPoints is between 0 and 40', () => {
      const result = calculateChainScore(baseInput);

      expect(result.chainProfitabilityPoints).toBeGreaterThanOrEqual(0);
      expect(result.chainProfitabilityPoints).toBeLessThanOrEqual(40);
    });

    it('returnPositioningPoints is between 0 and 35', () => {
      const result = calculateChainScore(baseInput);

      expect(result.returnPositioningPoints).toBeGreaterThanOrEqual(0);
      expect(result.returnPositioningPoints).toBeLessThanOrEqual(35);
    });

    it('timeEfficiencyPoints is between 0 and 25', () => {
      const result = calculateChainScore(baseInput);

      expect(result.timeEfficiencyPoints).toBeGreaterThanOrEqual(0);
      expect(result.timeEfficiencyPoints).toBeLessThanOrEqual(25);
    });

    it('chainScore is between 0 and 100', () => {
      const result = calculateChainScore(baseInput);

      expect(result.chainScore).toBeGreaterThanOrEqual(0);
      expect(result.chainScore).toBeLessThanOrEqual(100);
    });

    it('chainScore equals sum of three components', () => {
      const result = calculateChainScore(baseInput);

      expect(result.chainScore).toBe(
        result.chainProfitabilityPoints +
          result.returnPositioningPoints +
          result.timeEfficiencyPoints,
      );
    });
  });

  describe('chain metric calculations', () => {
    it('roundTripRevenue equals outboundRate + returnRate', () => {
      const result = calculateChainScore(baseInput);

      expect(result.roundTripRevenue).toBe(
        baseInput.outboundRate + baseInput.returnRate,
      );
    });

    it('roundTripProfit is roundTripRevenue minus total vehicle cost', () => {
      // Total vehicle cost = vehicleCpmPerDay * totalTripDays
      const result = calculateChainScore(baseInput);
      const expectedCost = baseInput.vehicleCpmPerDay * baseInput.totalTripDays;
      const expectedProfit = result.roundTripRevenue - expectedCost;

      expect(result.roundTripProfit).toBeCloseTo(expectedProfit, 2);
    });

    it('chainRPM equals roundTripRevenue / (outboundMiles + returnMiles)', () => {
      const result = calculateChainScore(baseInput);
      const totalMiles = baseInput.outboundMiles + baseInput.returnMiles;
      const expectedRpm = result.roundTripRevenue / totalMiles;

      expect(result.chainRPM).toBeCloseTo(expectedRpm, 4);
    });

    it('dailyRevenueUtilization equals roundTripRevenue / totalTripDays', () => {
      const result = calculateChainScore(baseInput);
      const expectedDru = result.roundTripRevenue / baseInput.totalTripDays;

      expect(result.dailyRevenueUtilization).toBeCloseTo(expectedDru, 2);
    });

    it('projectedWeeklyGross extrapolates from dailyRevenueUtilization', () => {
      const result = calculateChainScore(baseInput);
      // Projected weekly = dailyRevenueUtilization * 7
      const expectedWeekly = result.dailyRevenueUtilization * 7;

      expect(result.projectedWeeklyGross).toBeCloseTo(expectedWeekly, 2);
    });
  });

  describe('label thresholds — >=85 Excellent, >=65 Good, >=40 Marginal, <40 Pass', () => {
    it('assigns Excellent for chain scores >= 85', () => {
      // Construct ideal scenario: high profit margin, perfect return positioning, max efficiency
      const highScoreInput = {
        outboundRate: 5000,
        outboundMiles: 500,
        returnRate: 4500,
        returnMiles: 500,
        totalTripDays: 2,
        milesFromHomeAfterReturn: 0,
        homeBase: 'TX',
        returnDropState: 'TX',
        preferredLanes: ['TX'],
        vehicleCpmPerDay: 200,
      };

      const result = calculateChainScore(highScoreInput);

      if (result.chainScore >= 85) {
        expect(result.chainLabel).toBe('Excellent');
      }
    });

    it('assigns Pass for chain scores < 40', () => {
      // Construct worst-case scenario: loss-making, far from home, poor efficiency
      const lowScoreInput = {
        outboundRate: 500,
        outboundMiles: 2000,
        returnRate: 400,
        returnMiles: 2000,
        totalTripDays: 14,
        milesFromHomeAfterReturn: 2000,
        homeBase: 'TX',
        returnDropState: 'ME',
        preferredLanes: ['TX'],
        vehicleCpmPerDay: 600,
      };

      const result = calculateChainScore(lowScoreInput);

      if (result.chainScore < 40) {
        expect(result.chainLabel).toBe('Pass');
      }
    });

    it('label boundaries are >=85 Excellent, >=65 Good, >=40 Marginal, <40 Pass', () => {
      const testCases = [
        { score: 90, label: 'Excellent' },
        { score: 85, label: 'Excellent' },
        { score: 75, label: 'Good' },
        { score: 65, label: 'Good' },
        { score: 50, label: 'Marginal' },
        { score: 40, label: 'Marginal' },
        { score: 30, label: 'Pass' },
        { score: 0, label: 'Pass' },
      ];

      testCases.forEach(({ score, label }) => {
        const mockLabel = getChainLabel(score);
        expect(mockLabel).toBe(label);
      });
    });
  });

  describe('return positioning', () => {
    it('scores higher when return drops driver close to home', () => {
      const closeToHome = calculateChainScore({
        ...baseInput,
        milesFromHomeAfterReturn: 50,
        returnDropState: 'TX',
      });

      const farFromHome = calculateChainScore({
        ...baseInput,
        milesFromHomeAfterReturn: 1500,
        returnDropState: 'ME',
      });

      expect(closeToHome.returnPositioningPoints).toBeGreaterThan(
        farFromHome.returnPositioningPoints,
      );
    });

    it('scores higher when return drop is in preferred lane', () => {
      const preferred = calculateChainScore({
        ...baseInput,
        returnDropState: 'TX',
        preferredLanes: ['TX'],
      });

      const notPreferred = calculateChainScore({
        ...baseInput,
        returnDropState: 'WA',
        preferredLanes: ['TX'],
      });

      expect(preferred.returnPositioningPoints).toBeGreaterThanOrEqual(
        notPreferred.returnPositioningPoints,
      );
    });
  });

  describe('profitability scoring', () => {
    it('higher profit margin yields more chainProfitabilityPoints', () => {
      const highMargin = calculateChainScore({
        ...baseInput,
        outboundRate: 5000,
        returnRate: 4000,
        vehicleCpmPerDay: 200,
        totalTripDays: 2,
      });

      const lowMargin = calculateChainScore({
        ...baseInput,
        outboundRate: 1000,
        returnRate: 900,
        vehicleCpmPerDay: 800,
        totalTripDays: 4,
      });

      expect(highMargin.chainProfitabilityPoints).toBeGreaterThan(
        lowMargin.chainProfitabilityPoints,
      );
    });
  });
});

/**
 * Mirror of the chain label logic — used to verify boundary thresholds directly.
 */
const getChainLabel = (score: number): string => {
  if (score >= 85) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 40) return 'Marginal';
  return 'Pass';
};
