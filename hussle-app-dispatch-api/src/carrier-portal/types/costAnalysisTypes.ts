export interface CostAnalysisInput {
  truckPayment: number;
  insuranceCost: number;
  fuelCostPerGallon: number;
  milesPerGallon: number;
  maintenanceMonthlyCost: number;
  otherMonthlyCosts: number;
}

export type CostProfileSource = 'onboarding_estimate';

export interface CostAnalysisResult {
  breakEvenRpm: number;
  minimumRatePerMile: number;
  totalMonthlyExpenses: number;
  fuelCostPerMile: number;
  projectedNetPerMonth: number;
  revenuePerMile: number;
  costProfileVersion: number;
  costProfileSource: CostProfileSource;
}

export interface CarrierCostProfile {
  id: string;
  dispatchFeePercent: number;
  costProfileVersion: number;
}

export interface CarrierCostProfilePort {
  findById(id: string): Promise<CarrierCostProfile | null>;
  updateCostProfile(
    id: string,
    data: {
      minimumRatePerMile: number;
      costProfileVersion: number;
      costProfileSource: string;
    },
  ): Promise<void>;
}
