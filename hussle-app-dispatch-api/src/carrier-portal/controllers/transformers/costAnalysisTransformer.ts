import type { CostAnalysisResult } from '../../types/costAnalysisTypes';

interface CostAnalysisResponse {
  breakEvenRpm: number;
  minimumRatePerMile: number;
  totalMonthlyExpenses: number;
  fuelCostPerMile: number;
  projectedNetPerMonth: number;
  revenuePerMile: number;
  costProfileVersion: number;
  costProfileSource: string;
}

export const costAnalysisTransformer = (result: CostAnalysisResult): CostAnalysisResponse => ({
  breakEvenRpm: result.breakEvenRpm,
  minimumRatePerMile: result.minimumRatePerMile,
  totalMonthlyExpenses: result.totalMonthlyExpenses,
  fuelCostPerMile: result.fuelCostPerMile,
  projectedNetPerMonth: result.projectedNetPerMonth,
  revenuePerMile: result.revenuePerMile,
  costProfileVersion: result.costProfileVersion,
  costProfileSource: result.costProfileSource,
});
