// V2 cost-analysis input — see plan.md § Cost Analysis hybrid storage.
//
// Per-vehicle facts (ownership, loanPayment, insuranceMonthlyCost) write to Vehicle columns
// keyed by Vehicle.id. Everything else lives in OnboardingSession.answers.costAnalysis JSON.

export type EquipmentOwnership = 'owned' | 'financed';
export type OwnerPayBasis = 'gross' | 'net';

export interface EquipmentPaymentInput {
  assetId: string;
  ownership: EquipmentOwnership;
  monthlyAmount: number;
  insuranceMonthlyAmount?: number;
}

export interface CostAnalysisInput {
  equipmentPayments: EquipmentPaymentInput[];
  policies: { id: string; name: string; monthlyAmount: number }[];
  subscriptions: { id: string; name: string; monthlyAmount: number }[];
  overhead: {
    officeUtilities: number;
    accountingLegal: number;
    bankFeesCardsFactoring: number;
  };
  ownerPay: {
    perTruckWeekly: number;
    payBasis: OwnerPayBasis;
  };
  fuel: {
    dieselPrice: number;
    mpg: number;
  };
  wearOps: {
    maintenance: number;
    tires: number;
    def: number;
    tolls: number;
  };
  operating: {
    loadedMilesPerMonth: number;
    deadheadPct: number;
    marginPct: number;
  };
}

export type CostProfileSource = 'onboarding_estimate';

export interface CostAnalysisResult {
  breakEvenCpm: number;
  minimumRatePerMile: number;
  totalMonthlyExpenses: number;
  fuelCostPerMile: number;
  projectedNetPerMonth: number;
  costProfileVersion: number;
  costProfileSource: CostProfileSource;
}

export interface CarrierCostProfile {
  id: string;
  dispatchFeePercent: number;
  costProfileVersion: number;
}

export interface CarrierCostProfilePort {
  findById(carrierId: string, organizationId: string): Promise<CarrierCostProfile | null>;
}

// Implemented by a Prisma adapter; the entire write happens inside one $transaction.
export interface CostAnalysisWritePort {
  saveTransactional(
    carrierId: string,
    organizationId: string,
    args: {
      equipmentPayments: EquipmentPaymentInput[];
      answersPatch: Record<string, unknown>;
      minimumRatePerMile: number;
      nextCostProfileVersion: number;
      costProfileSource: CostProfileSource;
    },
  ): Promise<void>;
}
