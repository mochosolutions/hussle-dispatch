import { NotFoundError } from '@/shared/errors';
import { calculateDeadheadFeasibility } from '@/shared/utils/deadheadFeasibility';
import type { FeasibilityStatus } from '@/shared/utils/deadheadFeasibility';
import type { CityCoords } from '@/shared/geoLookup';
import type { Logger } from '@/shared/utils/logger';
import type { DriverAvailabilityWindow } from '@/drivers/types/driverAvailabilityTypes';
import type {
  EligibleDriver,
  EligibleDriverQueryPort,
  LoadPickupQueryPort,
  PickupDetails,
  RankedDriver,
  RankDriversInput,
} from '../types/rankDriverTypes';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_LEAD_HOURS = 4;
const MS_PER_HOUR = 3_600_000;

const STATUS_SORT_ORDER: Record<FeasibilityStatus | 'GREY', number> = {
  GREEN: 0,
  YELLOW: 1,
  RED: 2,
  GREY: 3,
};

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------

interface RankDriversDeps {
  getFirstPickup: LoadPickupQueryPort['getFirstPickup'];
  findActiveDriversForOrg: EligibleDriverQueryPort['findActiveDriversForOrg'];
  checkAvailabilityAt: (input: {
    driverId: string;
    organizationId: string;
    atUtc: Date;
  }) => Promise<DriverAvailabilityWindow>;
  getCityCoords: (city: string, state: string) => Promise<CityCoords | null>;
  isFacilityOpenAt?: (input: {
    placeId: string;
    organizationId: string;
    atUtc: Date;
  }) => Promise<{ isOpen: boolean }>;
  logger: Logger;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const resolveTargetArrivalUtc = (pickup: PickupDetails): Date =>
  pickup.appointmentStart;

const buildGreyDriver = (driver: EligibleDriver): RankedDriver => ({
  driverId: driver.id,
  driverName: `${driver.firstName} ${driver.lastName}`,
  currentLocation:
    driver.currentCity !== null && driver.currentState !== null
      ? `${driver.currentCity}, ${driver.currentState}`
      : null,
  deadheadMiles: 0,
  estimatedDriveMinutes: 0,
  estimatedArrivalUtc: new Date(0),
  bufferMinutes: 0,
  feasibilityStatus: 'GREY',
  scheduleAvailable: false,
  driverStatus: driver.status,
  hasConflictingLoad: false,
  driverFitPoints: 0,
});

interface RankContext {
  driver: EligibleDriver;
  pickup: PickupDetails;
  targetArrivalUtc: Date;
  organizationId: string;
}

const rankSingleDriver = async (
  ctx: RankContext,
  deps: RankDriversDeps,
): Promise<RankedDriver> => {
  const { driver, pickup, targetArrivalUtc, organizationId } = ctx;
  // 4a. Check schedule availability
  const availability = await deps.checkAvailabilityAt({
    driverId: driver.id,
    organizationId,
    atUtc: targetArrivalUtc,
  });

  if (!availability.available) {
    return { ...buildGreyDriver(driver), scheduleAvailable: false };
  }

  // 4b. Resolve driver coords
  if (driver.currentCity === null || driver.currentState === null) {
    return { ...buildGreyDriver(driver), scheduleAvailable: true };
  }

  const driverCoords = await deps.getCityCoords(driver.currentCity, driver.currentState);

  if (driverCoords === null) {
    return { ...buildGreyDriver(driver), scheduleAvailable: true };
  }

  // 4c. Check pickup has coords
  if (pickup.lat === null || pickup.lng === null) {
    return { ...buildGreyDriver(driver), scheduleAvailable: true };
  }

  const pickupCoords: CityCoords = { lat: pickup.lat, lng: pickup.lng };
  const nowUtc = new Date();

  const feasibility = calculateDeadheadFeasibility({
    driverCoords,
    pickupCoords,
    targetArrivalUtc,
    nowUtc,
  });

  const locationLabel = `${driver.currentCity}, ${driver.currentState}`;

  return {
    driverId: driver.id,
    driverName: `${driver.firstName} ${driver.lastName}`,
    currentLocation: locationLabel,
    deadheadMiles: feasibility.deadheadMiles,
    estimatedDriveMinutes: feasibility.estimatedDriveMinutes,
    estimatedArrivalUtc: feasibility.estimatedArrivalUtc,
    bufferMinutes: feasibility.bufferMinutes,
    feasibilityStatus: feasibility.status,
    scheduleAvailable: true,
    driverStatus: driver.status,
    hasConflictingLoad: false,
    driverFitPoints: 0,
  };
};

const compareRankedDrivers = (a: RankedDriver, b: RankedDriver): number => {
  const statusDiff =
    STATUS_SORT_ORDER[a.feasibilityStatus] - STATUS_SORT_ORDER[b.feasibilityStatus];

  if (statusDiff !== 0) {
    return statusDiff;
  }

  return a.deadheadMiles - b.deadheadMiles;
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const rankDrivers = async (
  input: RankDriversInput,
  deps: RankDriversDeps,
): Promise<RankedDriver[]> => {
  const { loadId, organizationId } = input;

  // 1. Load first pickup stop
  const pickup = await deps.getFirstPickup(loadId);

  if (pickup === null) {
    throw new NotFoundError('Load or pickup stop not found.');
  }

  // 2. Determine target arrival
  const targetArrivalUtc = resolveTargetArrivalUtc(pickup);

  // 3. Query active drivers
  const drivers = await deps.findActiveDriversForOrg(organizationId);

  deps.logger.info('Ranking drivers for load', {
    loadId,
    driverCount: drivers.length,
    targetArrivalUtc: targetArrivalUtc.toISOString(),
  });

  // 4. Evaluate each driver in parallel
  const results = await Promise.allSettled(
    drivers.map((driver) =>
      rankSingleDriver({ driver, pickup, targetArrivalUtc, organizationId }, deps),
    ),
  );

  const rankedDrivers: RankedDriver[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      rankedDrivers.push(result.value);
    } else {
      const driver = drivers[index];
      if (driver !== undefined) {
        deps.logger.error('Failed to rank driver', {
          driverId: driver.id,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
        rankedDrivers.push(buildGreyDriver(driver));
      }
    }
  });

  // 5. Sort: GREEN > YELLOW > RED > GREY, then by deadheadMiles ascending
  rankedDrivers.sort(compareRankedDrivers);

  return rankedDrivers;
};
