import type {
  CarrierCostProfilePort,
  CostAnalysisInput,
  CostAnalysisResult,
  CostAnalysisWritePort,
} from '../types/costAnalysisTypes';
import { NotFoundError } from '@/shared/errors/commonErrors';

const PROFIT_MARGIN_FALLBACK = 0.15;
const WEEKS_PER_MONTH = 52 / 12;

interface PortalCostAnalysisServiceDeps {
  carrierCostProfileRepo: CarrierCostProfilePort;
  writePort: CostAnalysisWritePort;
}

const sum = (xs: number[]): number => xs.reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0);

// Compute everything derived from the V2 cost ledger. Returns numbers (not Decimal) — the
// repo write coerces to Decimal at the Prisma boundary. Break-even CPM is computed on read
// and never persisted (per plan: no Carrier.breakEvenCpm column).
const computeOutputs = (
  input: CostAnalysisInput,
  dispatchFeePercent: number,
): {
  totalMonthlyExpenses: number;
  fuelCostPerMile: number;
  breakEvenCpm: number;
  minimumRatePerMile: number;
  projectedNetPerMonth: number;
} => {
  const truckCount = Math.max(input.equipmentPayments.length, 1);
  const loadedMiles = Math.max(input.operating.loadedMilesPerMonth, 1);
  const deadheadPct = input.operating.deadheadPct / 100;
  const marginPct = input.operating.marginPct > 0
    ? input.operating.marginPct / 100
    : PROFIT_MARGIN_FALLBACK;

  // Fixed monthly costs aggregated from all sources.
  const equipmentMonthly = sum(input.equipmentPayments.map((p) => p.monthlyAmount));
  const insuranceMonthly = sum(input.equipmentPayments.map((p) => p.insuranceMonthlyAmount ?? 0));
  const policiesMonthly = sum(input.policies.map((p) => p.monthlyAmount));
  const subscriptionsMonthly = sum(input.subscriptions.map((s) => s.monthlyAmount));
  const overheadMonthly =
    input.overhead.officeUtilities +
    input.overhead.accountingLegal +
    input.overhead.bankFeesCardsFactoring;

  const ownerPayMonthly = input.ownerPay.perTruckWeekly * WEEKS_PER_MONTH * truckCount;

  const fixedMonthly =
    equipmentMonthly +
    insuranceMonthly +
    policiesMonthly +
    subscriptionsMonthly +
    overheadMonthly +
    ownerPayMonthly;

  // Variable per-mile costs.
  const fuelCostPerMile = input.fuel.mpg > 0 ? input.fuel.dieselPrice / input.fuel.mpg : 0;
  const wearPerMile =
    input.wearOps.maintenance + input.wearOps.tires + input.wearOps.def + input.wearOps.tolls;
  const variablePerMile = fuelCostPerMile + wearPerMile;

  // Total miles drive deadhead adjustment.
  const totalMiles = deadheadPct < 1 ? loadedMiles / (1 - deadheadPct) : loadedMiles;
  const fuelMonthlyCost = fuelCostPerMile * totalMiles;
  const wearMonthlyCost = wearPerMile * totalMiles;

  const totalMonthlyExpenses = fixedMonthly + fuelMonthlyCost + wearMonthlyCost;

  const fixedPerLoadedMile = fixedMonthly / loadedMiles;
  const breakEvenCpm = fixedPerLoadedMile + (deadheadPct < 1 ? variablePerMile / (1 - deadheadPct) : variablePerMile);

  const feePct = dispatchFeePercent / 100;
  const denom = (1 - feePct) * (1 - marginPct);
  const minimumRatePerMile = denom > 0 ? breakEvenCpm / denom : breakEvenCpm;

  const projectedRevenue = minimumRatePerMile * loadedMiles;
  const projectedNetPerMonth = projectedRevenue - totalMonthlyExpenses;

  return {
    totalMonthlyExpenses,
    fuelCostPerMile,
    breakEvenCpm,
    minimumRatePerMile,
    projectedNetPerMonth,
  };
};

export const createPortalCostAnalysisService = (deps: PortalCostAnalysisServiceDeps) => ({
  saveCostAnalysis: async (
    carrierId: string,
    organizationId: string,
    input: CostAnalysisInput,
  ): Promise<CostAnalysisResult> => {
    const carrier = await deps.carrierCostProfileRepo.findById(carrierId, organizationId);
    if (!carrier) {
      throw new NotFoundError(`Carrier with id ${carrierId} not found`);
    }

    const outputs = computeOutputs(input, carrier.dispatchFeePercent);
    const nextCostProfileVersion = carrier.costProfileVersion + 1;

    // Mirror the full V2 cost ledger in answers.costAnalysis (transition-period parallel
    // ledger; the per-vehicle columns are the authoritative read for settlements).
    const answersPatch = {
      costAnalysis: {
        equipmentPayments: input.equipmentPayments,
        policies: input.policies,
        subscriptions: input.subscriptions,
        overhead: input.overhead,
        ownerPay: input.ownerPay,
        fuel: input.fuel,
        wearOps: input.wearOps,
        operating: input.operating,
        computed: {
          breakEvenCpm: outputs.breakEvenCpm,
          minimumRatePerMile: outputs.minimumRatePerMile,
          totalMonthlyExpenses: outputs.totalMonthlyExpenses,
          fuelCostPerMile: outputs.fuelCostPerMile,
        },
      },
    };

    await deps.writePort.saveTransactional(carrierId, organizationId, {
      equipmentPayments: input.equipmentPayments,
      answersPatch,
      minimumRatePerMile: outputs.minimumRatePerMile,
      nextCostProfileVersion,
      costProfileSource: 'onboarding_estimate',
    });

    return {
      breakEvenCpm: outputs.breakEvenCpm,
      minimumRatePerMile: outputs.minimumRatePerMile,
      totalMonthlyExpenses: outputs.totalMonthlyExpenses,
      fuelCostPerMile: outputs.fuelCostPerMile,
      projectedNetPerMonth: outputs.projectedNetPerMonth,
      costProfileVersion: nextCostProfileVersion,
      costProfileSource: 'onboarding_estimate',
    };
  },
});
