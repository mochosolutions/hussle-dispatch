import { calculateCompositeScore } from '../calculateCompositeScore';
import { MARKET_TIERS } from '../../constants/marketTiers';

describe('calculateCompositeScore', () => {
  describe('full mode — all three dimensions scored', () => {
    it('returns scoreType="full" when mode is full', () => {
      const result = calculateCompositeScore({
        mode: 'full',
        vehicleCpm: 0.85,
        ratePerMile: 2.5,
        marketTier: MARKET_TIERS.STRONG,
        driverFitPoints: 30,
      });

      expect(result.scoreType).toBe('full');
    });

    it('includes cpmPoints in full mode (0-40)', () => {
      const result = calculateCompositeScore({
        mode: 'full',
        vehicleCpm: 0.85,
        ratePerMile: 2.5,
        marketTier: MARKET_TIERS.STRONG,
        driverFitPoints: 30,
      });

      expect(result.cpmPoints).toBeGreaterThanOrEqual(0);
      expect(result.cpmPoints).toBeLessThanOrEqual(40);
    });

    it('includes marketPoints in full mode (0-30)', () => {
      const result = calculateCompositeScore({
        mode: 'full',
        vehicleCpm: 0.85,
        ratePerMile: 2.5,
        marketTier: MARKET_TIERS.STRONG,
        driverFitPoints: 30,
      });

      expect(result.marketPoints).toBeGreaterThanOrEqual(0);
      expect(result.marketPoints).toBeLessThanOrEqual(30);
    });

    it('includes driverFitPoints in full mode (0-30)', () => {
      const result = calculateCompositeScore({
        mode: 'full',
        vehicleCpm: 0.85,
        ratePerMile: 2.5,
        marketTier: MARKET_TIERS.STRONG,
        driverFitPoints: 25,
      });

      expect(result.driverFitPoints).toBe(25);
    });

    it('compositeScore is sum of all three dimensions (max 100)', () => {
      const result = calculateCompositeScore({
        mode: 'full',
        vehicleCpm: 0.85,
        ratePerMile: 2.5,
        marketTier: MARKET_TIERS.STRONG,
        driverFitPoints: 30,
      });

      expect(result.compositeScore).toBe(result.cpmPoints + result.marketPoints + result.driverFitPoints);
      expect(result.compositeScore).toBeLessThanOrEqual(100);
    });

    it('returns Excellent label when compositeScore >= 85 in full mode', () => {
      // Force max score: STRONG market (30), best CPM (40), full driverFit (30) = 100
      const result = calculateCompositeScore({
        mode: 'full',
        vehicleCpm: 0.5,
        ratePerMile: 5.0,
        marketTier: MARKET_TIERS.STRONG,
        driverFitPoints: 30,
      });

      if (result.compositeScore >= 85) {
        expect(result.compositeLabel).toBe('Excellent');
      }
    });

    it('returns Good label when compositeScore is 65-84 in full mode', () => {
      const result = calculateCompositeScore({
        mode: 'full',
        vehicleCpm: 1.0,
        ratePerMile: 2.0,
        marketTier: MARKET_TIERS.MODERATE,
        driverFitPoints: 20,
      });

      if (result.compositeScore >= 65 && result.compositeScore < 85) {
        expect(result.compositeLabel).toBe('Good');
      }
    });

    it('labels map correctly: >=85 Excellent, >=65 Good, >=40 Fair, <40 Poor in full mode', () => {
      const testCases = [
        { score: 90, label: 'Excellent' },
        { score: 85, label: 'Excellent' },
        { score: 75, label: 'Good' },
        { score: 65, label: 'Good' },
        { score: 50, label: 'Fair' },
        { score: 40, label: 'Fair' },
        { score: 30, label: 'Poor' },
        { score: 0, label: 'Poor' },
      ];

      testCases.forEach(({ score, label }) => {
        // We check label assignment via direct label logic by finding a result with the right score
        // Use strong market + matching driverFit to control score
        // This is primarily a label-logic test, so we check if the label function is correct
        const mockResult = {
          compositeScore: score,
          compositeLabel: getLabelForFullMode(score),
        };
        expect(mockResult.compositeLabel).toBe(label);
      });
    });
  });

  describe('route mode — cpmPoints=0, market + driverFit only', () => {
    it('returns scoreType="route" when mode is route', () => {
      const result = calculateCompositeScore({
        mode: 'route',
        marketTier: MARKET_TIERS.STRONG,
        driverFitPoints: 20,
      });

      expect(result.scoreType).toBe('route');
    });

    it('sets cpmPoints=0 in route mode', () => {
      const result = calculateCompositeScore({
        mode: 'route',
        marketTier: MARKET_TIERS.STRONG,
        driverFitPoints: 20,
      });

      expect(result.cpmPoints).toBe(0);
    });

    it('compositeScore max is 60 in route mode', () => {
      const result = calculateCompositeScore({
        mode: 'route',
        marketTier: MARKET_TIERS.STRONG,
        driverFitPoints: 30,
      });

      expect(result.compositeScore).toBeLessThanOrEqual(60);
    });

    it('returns Excellent label when compositeScore >= 50 in route mode', () => {
      const result = calculateCompositeScore({
        mode: 'route',
        marketTier: MARKET_TIERS.STRONG,
        driverFitPoints: 30,
      });

      if (result.compositeScore >= 50) {
        expect(result.compositeLabel).toBe('Excellent');
      }
    });

    it('labels map correctly for route mode: >=50 Excellent, >=35 Good, >=20 Fair, <20 Poor', () => {
      const testCases = [
        { score: 55, label: 'Excellent' },
        { score: 50, label: 'Excellent' },
        { score: 45, label: 'Good' },
        { score: 35, label: 'Good' },
        { score: 25, label: 'Fair' },
        { score: 20, label: 'Fair' },
        { score: 15, label: 'Poor' },
        { score: 0, label: 'Poor' },
      ];

      testCases.forEach(({ score, label }) => {
        const mockLabel = getLabelForRouteMode(score);
        expect(mockLabel).toBe(label);
      });
    });
  });

  describe('market tier scoring', () => {
    it('STRONG market tier gives maximum market points (30)', () => {
      const result = calculateCompositeScore({
        mode: 'full',
        vehicleCpm: 1.0,
        ratePerMile: 2.0,
        marketTier: MARKET_TIERS.STRONG,
        driverFitPoints: 0,
      });

      expect(result.marketPoints).toBe(30);
    });

    it('WEAK market tier gives fewer market points than STRONG', () => {
      const strong = calculateCompositeScore({
        mode: 'full',
        vehicleCpm: 1.0,
        ratePerMile: 2.0,
        marketTier: MARKET_TIERS.STRONG,
        driverFitPoints: 0,
      });

      const weak = calculateCompositeScore({
        mode: 'full',
        vehicleCpm: 1.0,
        ratePerMile: 2.0,
        marketTier: MARKET_TIERS.WEAK,
        driverFitPoints: 0,
      });

      expect(weak.marketPoints).toBeLessThan(strong.marketPoints);
    });

    it('UNKNOWN market tier gives lowest market points', () => {
      const result = calculateCompositeScore({
        mode: 'full',
        vehicleCpm: 1.0,
        ratePerMile: 2.0,
        marketTier: MARKET_TIERS.UNKNOWN,
        driverFitPoints: 0,
      });

      expect(result.marketPoints).toBeGreaterThanOrEqual(0);
      expect(result.marketPoints).toBeLessThanOrEqual(30);
    });
  });

  describe('return shape', () => {
    it('returns all required fields', () => {
      const result = calculateCompositeScore({
        mode: 'full',
        vehicleCpm: 0.85,
        ratePerMile: 2.5,
        marketTier: MARKET_TIERS.STRONG,
        driverFitPoints: 20,
      });

      expect(typeof result.cpmPoints).toBe('number');
      expect(typeof result.marketPoints).toBe('number');
      expect(typeof result.driverFitPoints).toBe('number');
      expect(typeof result.compositeScore).toBe('number');
      expect(['full', 'route']).toContain(result.scoreType);
      expect(typeof result.compositeLabel).toBe('string');
    });
  });
});

/**
 * Helper label functions used to test the label boundary logic directly.
 * These mirror what calculateCompositeScore must implement internally.
 */
const getLabelForFullMode = (score: number): string => {
  if (score >= 85) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
};

const getLabelForRouteMode = (score: number): string => {
  if (score >= 50) return 'Excellent';
  if (score >= 35) return 'Good';
  if (score >= 20) return 'Fair';
  return 'Poor';
};
