import type { CostAnalysisResult } from '../../types/costAnalysisTypes';

interface CostAnalysisResponse {
  breakEvenCpm: number;
  minimumRatePerMile: number;
  totalMonthlyExpenses: number;
  fuelCostPerMile: number;
  projectedNetPerMonth: number;
  costProfileVersion: number;
  costProfileSource: string;
}

export const costAnalysisTransformer = (result: CostAnalysisResult): CostAnalysisResponse => ({
  breakEvenCpm: result.breakEvenCpm,
  minimumRatePerMile: result.minimumRatePerMile,
  totalMonthlyExpenses: result.totalMonthlyExpenses,
  fuelCostPerMile: result.fuelCostPerMile,
  projectedNetPerMonth: result.projectedNetPerMonth,
  costProfileVersion: result.costProfileVersion,
  costProfileSource: result.costProfileSource,
});
