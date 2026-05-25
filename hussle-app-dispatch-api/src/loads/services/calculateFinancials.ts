import Decimal from 'decimal.js';
import { computeLoadFinancials } from './derivedFinancials';
import { calculateCpm } from '@/shared/scoring/calculateCpm';
import type { Logger } from '@/shared/utils/logger';
import type {
  LoadWithRelations,
  VehicleCpmQueryPort,
  DispatcherProfileQueryPort,
} from '../types/loadTypes';
import type { LoadStatusRepoPort } from '../types/loadStatusTypes';

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------

interface CalculateAndPersistFinancialsDeps {
  loadStatusRepo: Pick<LoadStatusRepoPort, 'sumAccessorialCharges' | 'updateFinancials'>;
  logger: Logger;
  load: LoadWithRelations;
  vehicleCpmQuery?: VehicleCpmQueryPort;
  dispatcherProfileQuery?: DispatcherProfileQueryPort;
  organizationId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const deriveEstimatedHours = (stops: LoadWithRelations['stops']): number | undefined => {
  const pickups = stops.filter((s) => s.type === 'PICKUP');
  const deliveries = stops.filter((s) => s.type === 'DELIVERY');

  const firstPickup = pickups.length > 0 ? pickups[0] : undefined;
  const lastDelivery = deliveries.length > 0 ? deliveries[deliveries.length - 1] : undefined;

  if (
    firstPickup?.appointmentStart === undefined ||
    firstPickup.appointmentStart === null ||
    lastDelivery?.appointmentStart === undefined ||
    lastDelivery.appointmentStart === null
  ) {
    return undefined;
  }

  const diffMs =
    lastDelivery.appointmentStart.getTime() - firstPickup.appointmentStart.getTime();
  if (diffMs <= 0) return undefined;

  return diffMs / (1000 * 60 * 60);
};

// ---------------------------------------------------------------------------
// Reusable financial calculation + persistence
// ---------------------------------------------------------------------------

export const calculateAndPersistFinancials = async (
  loadId: string,
  deps: CalculateAndPersistFinancialsDeps,
): Promise<void> => {
  const { load, logger, loadStatusRepo, vehicleCpmQuery } = deps;
  const { carrier } = load;

  if (carrier === null) {
    logger.warn('Skipping financial calculation — no carrier assigned', { loadId });
    return;
  }

  if (load.customerRate === null) {
    logger.warn('Skipping financial calculation — no customer rate set', { loadId });
    return;
  }

  const accessorialsTotal = await loadStatusRepo.sumAccessorialCharges(loadId);

  let vehicleCpm: number | undefined;
  if (load.vehicleId !== null && load.vehicleId !== undefined && vehicleCpmQuery !== undefined) {
    const expenses = await vehicleCpmQuery.getRecurringExpenses(load.vehicleId);
    const cpm = calculateCpm(
      expenses.map((e) => ({ monthlyCost: e.amount, milesPerMonth: e.milesPerMonth })),
    );
    if (cpm > 0) {
      vehicleCpm = cpm;
    }
  }

  // Look up the dispatcher profile if we have a dispatcherUserId but no snapshot
  // yet on the load. This preserves prior behavior for loads booked before US-09
  // snapshot writes shipped — once US-15's backfill or US-11's read swap lands,
  // the snapshot columns are authoritative.
  // For US-10 the orchestrator still reads from snapshot columns first; the
  // dispatcherProfileQuery is used as a fallback during transition.
  type DispatcherCommType = NonNullable<typeof load.dispatcherCommissionType>;
  let snapshotDispatcherType: DispatcherCommType | null =
    load.dispatcherCommissionType ?? null;
  let snapshotDispatcherRate: string | null =
    load.dispatcherCommissionRate !== null && load.dispatcherCommissionRate !== undefined
      ? load.dispatcherCommissionRate.toString()
      : null;

  if (
    snapshotDispatcherType === null &&
    load.dispatcherUserId !== null &&
    load.dispatcherUserId !== undefined &&
    deps.dispatcherProfileQuery !== undefined &&
    deps.organizationId !== undefined
  ) {
    const profile = await deps.dispatcherProfileQuery.findByUserId(
      load.dispatcherUserId,
      deps.organizationId,
    );
    if (profile !== null) {
      // profile.commissionType is the string-typed enum value from the profile
      // row. Narrow to the Prisma enum union via runtime check.
      const allowedTypes: DispatcherCommType[] = [
        'PERCENTAGE_OF_MARGIN',
        'PERCENTAGE_OF_GROSS',
        'FLAT_PER_LOAD',
      ];
      const found = allowedTypes.find((t) => t === profile.commissionType);
      if (found !== undefined) {
        snapshotDispatcherType = found;
        snapshotDispatcherRate = profile.commissionRate;
      }
    }
  }

  // Driver snapshot fallback — same transitional pattern.
  let snapshotDriverType: typeof load.driverPayType = load.driverPayType ?? null;
  let snapshotDriverRate: string | null =
    load.driverPayRate !== null && load.driverPayRate !== undefined ? load.driverPayRate.toString() : null;
  if (snapshotDriverType === null && load.driver !== null) {
    if (load.driver.payType !== null && load.driver.payRate !== null) {
      snapshotDriverType = load.driver.payType;
      snapshotDriverRate = load.driver.payRate.toString();
    }
  }

  // Carrier-term snapshot fallbacks (transitional).
  const snapshotDispatchFeeType: 'PERCENTAGE' | 'FLAT' =
    load.dispatchFeeType ?? (carrier.dispatchFeeType as 'PERCENTAGE' | 'FLAT');
  const snapshotDispatchFeeAmount: string =
    load.dispatchFeeAmount !== null && load.dispatchFeeAmount !== undefined
      ? load.dispatchFeeAmount.toString()
      : carrier.dispatchFeePercent.toString();
  const snapshotPartnerSplit: string =
    load.partnerSplitPercent !== null && load.partnerSplitPercent !== undefined
      ? load.partnerSplitPercent.toString()
      : carrier.partnerSplitPercent.toString();
  const snapshotFeeIncludesAccessorials: boolean =
    load.feeIncludesAccessorials ?? carrier.feeIncludesAccessorials;
  const snapshotPayFromNet: boolean = load.payFromNet ?? carrier.payFromNet;

  // PER_HOUR estimatedHours derivation (still callsite-derived, not snapshotted).
  const resolveEstimatedHours = (): number | undefined => {
    if (snapshotDriverType !== 'PER_HOUR') return undefined;
    if (load.estimatedHours !== null) return Number(load.estimatedHours);
    return deriveEstimatedHours(load.stops);
  };
  const estimatedHoursForPerHour = resolveEstimatedHours();

  // Build a shallow Load-shaped object with the resolved snapshot terms, so
  // computeLoadFinancials sees the effective values. We don't mutate `load`.
  const loadForCalc = {
    ...load,
    dispatchFeeType: snapshotDispatchFeeType,
    dispatchFeeAmount: snapshotDispatchFeeAmount !== null ? new Decimal(snapshotDispatchFeeAmount) : null,
    partnerSplitPercent: snapshotPartnerSplit !== null ? new Decimal(snapshotPartnerSplit) : null,
    driverPayType: snapshotDriverType,
    driverPayRate: snapshotDriverRate !== null ? new Decimal(snapshotDriverRate) : null,
    dispatcherCommissionType: snapshotDispatcherType,
    dispatcherCommissionRate:
      snapshotDispatcherRate !== null ? new Decimal(snapshotDispatcherRate) : null,
    feeIncludesAccessorials: snapshotFeeIncludesAccessorials,
    payFromNet: snapshotPayFromNet,
  };

  // carrierType is read from load.carrierType inside computeLoadFinancials (US-09b).
  // We still overlay the live carrier.type onto loadForCalc so that mid-flow
  // recompute paths that pass a stale Load row see the current type. Snapshot
  // rows produced by buildRateSnapshot already carry the correct value.
  const loadForCalcWithCarrierType = {
    ...loadForCalc,
    carrierType: carrier.type,
  };

  const result = computeLoadFinancials(loadForCalcWithCarrierType, new Decimal(accessorialsTotal), {
    vehicleCpm,
    estimatedHours: estimatedHoursForPerHour,
  });

  await loadStatusRepo.updateFinancials(loadId, {
    dispatchFee: result.dispatchFee,
    partnerSplit: result.partnerSplit,
    ratePerMile: result.ratePerMile,
    ratePerTotalMile: result.ratePerTotalMile,
    carrierPayout: result.carrierPayout,
    companyMargin: result.companyMargin,
    driverPay: result.driverPay,
    estimatedCost: result.estimatedCost,
    dispatcherComm: result.dispatcherComm,
  });

  logger.info('Financials calculated and persisted', {
    loadId,
    dispatchFee: result.dispatchFee,
    partnerSplit: result.partnerSplit,
    ratePerMile: result.ratePerMile,
    ratePerTotalMile: result.ratePerTotalMile,
    carrierPayout: result.carrierPayout,
    companyMargin: result.companyMargin,
    driverPay: result.driverPay,
    estimatedCost: result.estimatedCost,
    dispatcherComm: result.dispatcherComm,
  });
};
