/**
 * Calculates the minimum bookable rate for a load.
 *
 * Formula: ceil_to_50(vehicleCpm * totalMiles / (1 - feePercent) / (1 - profitMargin))
 *
 * Rounds UP to the nearest $50 to ensure profitability floor is never undercut.
 */

interface MinBookRateInput {
  vehicleCpm: number;
  totalMiles: number;
  feePercent: number;
  profitMargin: number;
}

export const calculateMinBookRate = (input: MinBookRateInput): number => {
  const { vehicleCpm, totalMiles, feePercent, profitMargin } = input;

  const base = (vehicleCpm * totalMiles) / (1 - feePercent) / (1 - profitMargin);

  return Math.ceil(base / 50) * 50;
};
