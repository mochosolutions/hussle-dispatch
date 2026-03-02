import { calculateMinBookRate } from '../calculateMinBookRate';

describe('calculateMinBookRate', () => {
  describe('PRD acceptance criteria example', () => {
    it('returns 900 for vehicleCpm=0.85, totalMiles=800, feePercent=0.10, profitMargin=0.15', () => {
      // Arrange
      const input = {
        vehicleCpm: 0.85,
        totalMiles: 800,
        feePercent: 0.1,
        profitMargin: 0.15,
      };

      // Act
      const result = calculateMinBookRate(input);

      // Assert
      expect(result).toBe(900);
    });
  });

  describe('rounding up to nearest $50', () => {
    it('rounds up when result is not a multiple of 50', () => {
      // base = 0.85 * 800 / 0.90 / 0.85 ≈ 889.28 → ceil to 900
      const result = calculateMinBookRate({
        vehicleCpm: 0.85,
        totalMiles: 800,
        feePercent: 0.1,
        profitMargin: 0.15,
      });

      expect(result % 50).toBe(0);
      expect(result).toBeGreaterThanOrEqual(889.28);
    });

    it('does not round up when result is exactly a multiple of 50', () => {
      // vehicleCpm=0.5, totalMiles=100, feePercent=0, profitMargin=0 → base = 50
      const result = calculateMinBookRate({
        vehicleCpm: 0.5,
        totalMiles: 100,
        feePercent: 0,
        profitMargin: 0,
      });

      expect(result).toBe(50);
    });

    it('always rounds UP never down', () => {
      // vehicleCpm=0.5, totalMiles=101 → base = 50.5, ceil to 50 = 100
      const result = calculateMinBookRate({
        vehicleCpm: 0.5,
        totalMiles: 101,
        feePercent: 0,
        profitMargin: 0,
      });

      expect(result).toBe(100);
    });
  });

  describe('formula correctness', () => {
    it('applies feePercent divisor correctly', () => {
      // vehicleCpm=1.0, totalMiles=100, feePercent=0.10, profitMargin=0
      // base = 100 / 0.90 ≈ 111.11 → ceil to 150
      const result = calculateMinBookRate({
        vehicleCpm: 1.0,
        totalMiles: 100,
        feePercent: 0.1,
        profitMargin: 0,
      });

      expect(result).toBe(150);
    });

    it('applies profitMargin divisor correctly', () => {
      // vehicleCpm=1.0, totalMiles=100, feePercent=0, profitMargin=0.20
      // base = 100 / 1.0 / 0.80 = 125 → ceil to 150
      const result = calculateMinBookRate({
        vehicleCpm: 1.0,
        totalMiles: 100,
        feePercent: 0,
        profitMargin: 0.2,
      });

      expect(result).toBe(150);
    });

    it('returns a number (not a string or NaN)', () => {
      const result = calculateMinBookRate({
        vehicleCpm: 0.85,
        totalMiles: 800,
        feePercent: 0.1,
        profitMargin: 0.15,
      });

      expect(typeof result).toBe('number');
      expect(Number.isNaN(result)).toBe(false);
    });
  });
});
