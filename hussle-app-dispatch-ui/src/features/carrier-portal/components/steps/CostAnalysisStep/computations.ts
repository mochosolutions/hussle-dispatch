// ---------------------------------------------------------------------------
// CostAnalysisStep — pure derivation helpers.
//
// Mirrors the math used by the API service `portalCostAnalysisService` so the
// live RateCard preview matches the value the backend persists on submit.
//
// Inputs are the assembled CostAnalysisInput shape from `costAnalysisTypes`
// (vehicleId-keyed equipmentPayments, monthly policies/subscriptions, dollar-
// per-mile wearOps, fuel inputs, mileage/margin operating assumptions).
//
// No imports from React, Redux, or the engine — keeps the file trivially
// unit-testable and reusable by the renderer's `useMemo` derivation.
// ---------------------------------------------------------------------------

const WEEKS_PER_MONTH = 52 / 12;

export type EquipmentOwnership = 'owned' | 'financed';
export type OwnerPayBasis = 'gross' | 'net';

export interface EquipmentPayment {
  assetId: string;
  ownership: EquipmentOwnership;
  monthlyAmount: number;
  insuranceMonthlyAmount: number;
}

export interface NamedMonthlyItem {
  id: string;
  name: string;
  monthlyAmount: number;
}

export interface OverheadInput {
  officeUtilities: number;
  accountingLegal: number;
  bankFeesCardsFactoring: number;
}

export interface OwnerPayInput {
  perTruckWeekly: number;
  payBasis: OwnerPayBasis;
}

export interface FuelInput {
  dieselPrice: number;
  mpg: number;
}

export interface WearOpsInput {
  maintenance: number;
  tires: number;
  def: number;
  tolls: number;
}

export interface OperatingInput {
  loadedMilesPerMonth: number;
  deadheadPct: number;
  marginPct: number;
}

export interface CostInputs {
  equipmentPayments: EquipmentPayment[];
  policies: NamedMonthlyItem[];
  subscriptions: NamedMonthlyItem[];
  overhead: OverheadInput;
  ownerPay: OwnerPayInput;
  fuel: FuelInput;
  wearOps: WearOpsInput;
  operating: OperatingInput;
}

export interface DerivedCostValues {
  equipmentMonthly: number;
  policiesMonthly: number;
  subscriptionsMonthly: number;
  overheadMonthly: number;
  ownerPayMonthly: number;
  fixedMonthly: number;
  fuelCostPerMile: number;
  variablePerMile: number;
  loadedAdjustedMiles: number;
  fixedPerLoadedMile: number;
  deadheadAdj: number;
  breakEvenCpm: number;
  marginPerMile: number;
  minRatePerMile: number;
  annualizedMiles: number;
}

const sum = (values: number[]): number => values.reduce((acc, n) => acc + n, 0);

const safeNumber = (value: number): number => (Number.isFinite(value) ? value : 0);

export const equipmentMonthly = (payments: EquipmentPayment[]): number =>
  sum(
    payments.map((p) =>
      p.ownership === 'owned' ? p.insuranceMonthlyAmount : p.monthlyAmount + p.insuranceMonthlyAmount,
    ),
  );

export const namedItemsMonthly = (items: NamedMonthlyItem[]): number =>
  sum(items.map((i) => i.monthlyAmount));

export const overheadMonthly = (o: OverheadInput): number =>
  o.officeUtilities + o.accountingLegal + o.bankFeesCardsFactoring;

export const ownerPayMonthly = (op: OwnerPayInput, truckCount: number): number =>
  op.perTruckWeekly * WEEKS_PER_MONTH * truckCount;

export const fuelCostPerMile = (fuel: FuelInput): number =>
  fuel.mpg > 0 ? safeNumber(fuel.dieselPrice / fuel.mpg) : 0;

export const variablePerMile = (fuel: FuelInput, wearOps: WearOpsInput): number =>
  fuelCostPerMile(fuel) + wearOps.maintenance + wearOps.tires + wearOps.def + wearOps.tolls;

export const computeDerivedValues = (inputs: CostInputs): DerivedCostValues => {
  const truckCount = inputs.equipmentPayments.length > 0 ? inputs.equipmentPayments.length : 1;

  const equipMo = equipmentMonthly(inputs.equipmentPayments);
  const policiesMo = namedItemsMonthly(inputs.policies);
  const subsMo = namedItemsMonthly(inputs.subscriptions);
  const overheadMo = overheadMonthly(inputs.overhead);
  const ownerMo = ownerPayMonthly(inputs.ownerPay, truckCount);
  const fixedMo = equipMo + policiesMo + subsMo + overheadMo + ownerMo;

  const fuelCpm = fuelCostPerMile(inputs.fuel);
  const variableCpm = variablePerMile(inputs.fuel, inputs.wearOps);

  const { loadedMilesPerMonth, deadheadPct, marginPct } = inputs.operating;
  const loadedAdjusted = loadedMilesPerMonth * (1 - deadheadPct / 100);
  const fixedPerLoaded = loadedAdjusted > 0 ? fixedMo / loadedAdjusted : 0;
  const deadheadAdj = variableCpm * (deadheadPct / 100);
  const breakEven = fixedPerLoaded + variableCpm + deadheadAdj;
  const marginPerMile = breakEven * (marginPct / 100);
  const minRate = breakEven + marginPerMile;
  const annualizedMiles = loadedMilesPerMonth * 12;

  return {
    equipmentMonthly: equipMo,
    policiesMonthly: policiesMo,
    subscriptionsMonthly: subsMo,
    overheadMonthly: overheadMo,
    ownerPayMonthly: ownerMo,
    fixedMonthly: fixedMo,
    fuelCostPerMile: fuelCpm,
    variablePerMile: variableCpm,
    loadedAdjustedMiles: loadedAdjusted,
    fixedPerLoadedMile: fixedPerLoaded,
    deadheadAdj,
    breakEvenCpm: breakEven,
    marginPerMile,
    minRatePerMile: minRate,
    annualizedMiles,
  };
};

export const hasAnyCostData = (derived: DerivedCostValues): boolean =>
  derived.fixedMonthly > 0 || derived.variablePerMile > 0 || derived.annualizedMiles > 0;
