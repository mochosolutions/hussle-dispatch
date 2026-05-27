/**
 * Calculates cost-per-mile (CPM) from a vehicle expense breakdown.
 *
 * Each expense item provides a monthly cost and the miles driven that month.
 * Expense items that share the same `milesPerMonth` represent parallel costs
 * (e.g., fuel, insurance, truck payment) for a single truck driving those miles.
 * Miles are deduplicated so the same mileage base is not counted multiple times.
 *
 * CPM = sum(monthlyCost) / sum(unique milesPerMonth values)
 */

export interface ExpenseItem {
  monthlyCost: number;
  milesPerMonth: number;
}

export const calculateCpm = (expenses: ExpenseItem[]): number => {
  if (expenses.length === 0) {
    return 0;
  }

  const totalCost = expenses.reduce((sum, e) => sum + e.monthlyCost, 0);
  const uniqueMiles = new Set(expenses.map((e) => e.milesPerMonth));
  const totalMiles = Array.from(uniqueMiles).reduce((sum, m) => sum + m, 0);

  if (totalMiles <= 0) {
    return 0;
  }

  return totalCost / totalMiles;
};
