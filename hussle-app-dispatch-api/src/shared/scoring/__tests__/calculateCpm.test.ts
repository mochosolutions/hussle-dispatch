import { calculateCpm } from '../calculateCpm';

describe('calculateCpm', () => {
  describe('basic calculation', () => {
    it('returns total monthly cost divided by total miles per month', () => {
      // Arrange
      const expenses = [
        { monthlyCost: 850, milesPerMonth: 10000 },
      ];

      // Act
      const result = calculateCpm(expenses);

      // Assert
      expect(result).toBeCloseTo(0.085, 5);
    });

    it('aggregates multiple expense items correctly', () => {
      // Arrange: two expenses with same miles
      const expenses = [
        { monthlyCost: 500, milesPerMonth: 10000 },
        { monthlyCost: 350, milesPerMonth: 10000 },
      ];

      // Act
      const result = calculateCpm(expenses);

      // Assert: (500+350) / 10000 = 0.085
      expect(result).toBeCloseTo(0.085, 5);
    });

    it('correctly handles multiple expenses with different miles', () => {
      // Arrange: expenses with different milesPerMonth values
      // total cost = 1000+500 = 1500, total miles = 10000+5000 = 15000
      // CPM = 1500/15000 = 0.1
      const expenses = [
        { monthlyCost: 1000, milesPerMonth: 10000 },
        { monthlyCost: 500, milesPerMonth: 5000 },
      ];

      // Act
      const result = calculateCpm(expenses);

      // Assert
      expect(result).toBeCloseTo(0.1, 5);
    });
  });

  describe('return type', () => {
    it('returns a number', () => {
      const result = calculateCpm([{ monthlyCost: 850, milesPerMonth: 10000 }]);

      expect(typeof result).toBe('number');
    });
  });

  describe('real-world example', () => {
    it('returns correct CPM for typical owner-operator monthly breakdown', () => {
      // Truck payment: $2000, Fuel: $3500, Insurance: $800, Maintenance: $500
      // Total: $6800, Miles: 10000 → CPM = 0.68
      const expenses = [
        { monthlyCost: 2000, milesPerMonth: 10000 },
        { monthlyCost: 3500, milesPerMonth: 10000 },
        { monthlyCost: 800, milesPerMonth: 10000 },
        { monthlyCost: 500, milesPerMonth: 10000 },
      ];

      const result = calculateCpm(expenses);

      expect(result).toBeCloseTo(0.68, 5);
    });
  });
});
