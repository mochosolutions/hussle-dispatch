import { calculateLoadFinancials } from '@/shared/financials';
import { calculateCpm } from '@/shared/scoring/calculateCpm';
import { OwnerOperatorNotSupportedError } from '@/shared/errors';
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

  try {
    const driverPayInput =
      load.driver?.payType !== null &&
      load.driver?.payType !== undefined &&
      load.driver?.payRate !== null &&
      load.driver?.payRate !== undefined
        ? {
            payType: load.driver.payType,
            payRate: load.driver.payRate.toString(),
            ...(load.driver.payType === 'PER_HOUR'
              ? {
                  estimatedHours:
                    load.estimatedHours !== null
                      ? Number(load.estimatedHours)
                      : deriveEstimatedHours(load.stops),
                }
              : {}),
          }
        : undefined;

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

    let dispatcherCommInput: { commissionType: string; commissionRate: string } | undefined;

    if (
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
        dispatcherCommInput = {
          commissionType: profile.commissionType,
          commissionRate: profile.commissionRate,
        };
      }
    }

    const result = calculateLoadFinancials({
      customerRate: load.customerRate.toString(),
      accessorials: accessorialsTotal,
      loadedMiles: load.loadedMiles,
      totalMiles: load.totalMiles ?? null,
      carrier: {
        type: carrier.type,
        dispatchFeePercent: carrier.dispatchFeePercent.toString(),
        partnerSplitPercent: carrier.partnerSplitPercent.toString(),
        feeIncludesAccessorials: carrier.feeIncludesAccessorials,
        feeType: carrier.feeType,
        payFromNet: carrier.payFromNet,
      },
      driverPay: driverPayInput,
      vehicleCpm,
      dispatcherComm: dispatcherCommInput,
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
  } catch (error: unknown) {
    if (error instanceof OwnerOperatorNotSupportedError) {
      logger.warn('Skipping financial calculation — owner-operator not supported', { loadId });
      return;
    }
    throw error;
  }
};
