// [ASSUMED] Constants reverse-engineered from .planning-legacy/carrier-onboarding/designs/interview-cost-analysis.md
// (RESEARCH.md A1). Break-even ~$1.94 and minimum ~$2.44 sample numbers reverse-engineer cleanly to:
// total monthly ~$15,520, miles = 8000 → $1.94 RPM × 1.258 ≈ $2.44.
// TODO: confirm baseline constants with user before phase ships.

/** Industry baseline miles per month used for break-even calculations. */
export const ASSUMED_MONTHLY_MILES = 8000;

/** Minimum profit margin applied to break-even rate to derive the minimum booking rate. */
export const MIN_PROFIT_MARGIN = 0.25;

export interface CostInputs {
  truckPayment: number;
  insuranceCost: number;
  fuelCostPerGallon: number;
  milesPerGallon: number;
  maintenanceMonthlyCost: number;
  otherMonthlyCosts: number;
  ownsOutright?: boolean;
}

export interface CostOutputs {
  totalMonthlyExpenses: number;
  monthlyFixed: number;
  monthlyVariable: number;
  fuelCostPerMile: number;
  breakEvenRpm: number;
  minimumRatePerMile: number;
}

/**
 * Computes break-even rate per mile and minimum booking rate from carrier cost inputs.
 * Pure function — no side effects, no Redux dependency.
 */
export const computeCostAnalysis = (inputs: CostInputs): CostOutputs => {
  const truckPayment = inputs.ownsOutright ? 0 : inputs.truckPayment;
  const monthlyFixed =
    truckPayment + inputs.insuranceCost + inputs.maintenanceMonthlyCost + inputs.otherMonthlyCosts;
  const fuelCostPerMile = inputs.fuelCostPerGallon / inputs.milesPerGallon;
  const monthlyVariable = fuelCostPerMile * ASSUMED_MONTHLY_MILES;
  const totalMonthlyExpenses = monthlyFixed + monthlyVariable;
  const breakEvenRpm = totalMonthlyExpenses / ASSUMED_MONTHLY_MILES;
  const minimumRatePerMile = breakEvenRpm * (1 + MIN_PROFIT_MARGIN);

  return {
    totalMonthlyExpenses,
    monthlyFixed,
    monthlyVariable,
    fuelCostPerMile,
    breakEvenRpm,
    minimumRatePerMile,
  };
};
