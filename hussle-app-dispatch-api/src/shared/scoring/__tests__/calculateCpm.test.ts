import { calculateCpm } from '../calculateCpm';

describe('calculateCpm', () => {
  describe('normal expenses', () => {
    it('returns totalCost divided by totalUniqueMiles for two expenses with different miles', () => {
      // Arrange
      const expenses = [
        { monthlyCost: 1000, milesPerMonth: 10000 },
        { monthlyCost: 500, milesPerMonth: 5000 },
      ];

      // Act
      const result = calculateCpm(expenses);

      // Assert: (1000 + 500) / (10000 + 5000) = 1500 / 15000 = 0.1
      expect(result).toBeCloseTo(0.1, 5);
    });
  });

  describe('expense deduplication', () => {
    it('counts shared milesPerMonth only once when two expenses have the same value', () => {
      // Arrange: same milesPerMonth on both — miles should be counted once
      const expenses = [
        { monthlyCost: 500, milesPerMonth: 10000 },
        { monthlyCost: 350, milesPerMonth: 10000 },
      ];

      // Act
      const result = calculateCpm(expenses);

      // Assert: (500 + 350) / 10000 = 0.085
      expect(result).toBeCloseTo(0.085, 5);
    });
  });

  describe('single expense', () => {
    it('returns straightforward division for a single expense item', () => {
      // Arrange
      const expenses = [{ monthlyCost: 850, milesPerMonth: 10000 }];

      // Act
      const result = calculateCpm(expenses);

      // Assert: 850 / 10000 = 0.085
      expect(result).toBeCloseTo(0.085, 5);
    });
  });

  describe('zero miles (bug)', () => {
    it('returns 0 when all expenses have milesPerMonth of 0', () => {
      // Arrange: totalMiles = 0 — current code returns Infinity (division by zero)
      const expenses = [
        { monthlyCost: 500, milesPerMonth: 0 },
        { monthlyCost: 300, milesPerMonth: 0 },
      ];

      // Act
      const result = calculateCpm(expenses);

      // Assert: should return 0, not Infinity
      expect(result).toBe(0);
    });
  });

  describe('empty expense list', () => {
    it('returns 0 when no expenses are provided', () => {
      // Arrange: empty array — current code returns NaN (0 / 0)
      const expenses: { monthlyCost: number; milesPerMonth: number }[] = [];

      // Act
      const result = calculateCpm(expenses);

      // Assert: should return 0, not NaN
      expect(result).toBe(0);
    });
  });

  describe('mixed expenses with deduplication', () => {
    it('deduplicates shared milesPerMonth and sums unique values correctly', () => {
      // Arrange: three expenses, two sharing 10000 miles, one with 5000
      const expenses = [
        { monthlyCost: 2000, milesPerMonth: 10000 },
        { monthlyCost: 800, milesPerMonth: 10000 },
        { monthlyCost: 600, milesPerMonth: 5000 },
      ];

      // Act
      const result = calculateCpm(expenses);

      // Assert: (2000 + 800 + 600) / (10000 + 5000) = 3400 / 15000 ≈ 0.22667
      expect(result).toBeCloseTo(3400 / 15000, 5);
    });
  });
});
