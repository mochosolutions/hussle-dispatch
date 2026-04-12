import type { CostAnalysisInput, CostAnalysisResult, CarrierCostProfilePort } from '../types/costAnalysisTypes';
import type { ExpenseItem } from '@/shared/scoring/calculateCpm';
import { calculateCpm } from '@/shared/scoring/calculateCpm';
import { calculateMinBookRate } from '@/shared/scoring/calculateMinBookRate';
import { NotFoundError } from '@/shared/errors/commonErrors';

const ESTIMATED_MONTHLY_MILES = 10000;
const PROFIT_MARGIN_PERCENT = 15;

interface PortalCostAnalysisServiceDeps {
  carrierCostProfileRepo: CarrierCostProfilePort;
}

export const createPortalCostAnalysisService = (deps: PortalCostAnalysisServiceDeps) => ({
  saveCostAnalysis: async (
    carrierId: string,
    input: CostAnalysisInput,
  ): Promise<CostAnalysisResult> => {
    const carrier = await deps.carrierCostProfileRepo.findById(carrierId);

    if (!carrier) {
      throw new NotFoundError(`Carrier with id ${carrierId} not found`);
    }

    const fuelCostPerMile = input.fuelCostPerGallon / input.milesPerGallon;
    const fuelMonthlyCost = fuelCostPerMile * ESTIMATED_MONTHLY_MILES;

    const totalMonthlyExpenses =
      input.truckPayment +
      input.insuranceCost +
      input.maintenanceMonthlyCost +
      input.otherMonthlyCosts +
      fuelMonthlyCost;

    const expenses: ExpenseItem[] = [
      { monthlyCost: input.truckPayment, milesPerMonth: ESTIMATED_MONTHLY_MILES },
      { monthlyCost: input.insuranceCost, milesPerMonth: ESTIMATED_MONTHLY_MILES },
      { monthlyCost: input.maintenanceMonthlyCost, milesPerMonth: ESTIMATED_MONTHLY_MILES },
      { monthlyCost: input.otherMonthlyCosts, milesPerMonth: ESTIMATED_MONTHLY_MILES },
      { monthlyCost: fuelMonthlyCost, milesPerMonth: ESTIMATED_MONTHLY_MILES },
    ];

    const cpm = calculateCpm(expenses);

    const minimumRatePerMile = calculateMinBookRate({
      vehicleCpm: cpm,
      totalMiles: ESTIMATED_MONTHLY_MILES,
      feePercent: carrier.dispatchFeePercent / 100,
      profitMargin: PROFIT_MARGIN_PERCENT / 100,
    });

    const breakEvenRpm = cpm;
    const revenuePerMile = minimumRatePerMile / ESTIMATED_MONTHLY_MILES;
    const projectedRevenue = minimumRatePerMile;
    const projectedNetPerMonth = projectedRevenue - totalMonthlyExpenses;

    const newVersion = carrier.costProfileVersion + 1;

    await deps.carrierCostProfileRepo.updateCostProfile(carrierId, {
      minimumRatePerMile,
      costProfileVersion: newVersion,
      costProfileSource: 'onboarding_estimate',
    });

    return {
      breakEvenRpm,
      minimumRatePerMile,
      totalMonthlyExpenses,
      fuelCostPerMile,
      projectedNetPerMonth,
      revenuePerMile,
      costProfileVersion: newVersion,
      costProfileSource: 'onboarding_estimate',
    };
  },
});
