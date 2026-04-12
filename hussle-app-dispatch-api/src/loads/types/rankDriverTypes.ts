import type { SchedulingType } from '@prisma/client';
import type { FeasibilityStatus } from '@/shared/utils/deadheadFeasibility';

// ---------------------------------------------------------------------------
// Service input
// ---------------------------------------------------------------------------

export interface RankDriversInput {
  loadId: string;
  organizationId: string;
}

// ---------------------------------------------------------------------------
// Pickup details (first pickup stop info needed for ranking)
// ---------------------------------------------------------------------------

export interface PickupDetails {
  placeId: string | null;
  lat: number | null;
  lng: number | null;
  appointmentStart: Date | null;
  appointmentEnd: Date | null;
  targetDate: Date | null;
  schedulingType: SchedulingType;
}

// ---------------------------------------------------------------------------
// Ranked driver result
// ---------------------------------------------------------------------------

export interface RankedDriver {
  driverId: string;
  driverName: string;
  currentLocation: string | null;
  deadheadMiles: number;
  estimatedDriveMinutes: number;
  estimatedArrivalUtc: Date;
  bufferMinutes: number;
  feasibilityStatus: FeasibilityStatus | 'GREY';
  scheduleAvailable: boolean;
  driverStatus: string;
  hasConflictingLoad: boolean;
  driverFitPoints: number;
}

// ---------------------------------------------------------------------------
// Cross-module query port (drivers)
// ---------------------------------------------------------------------------

export interface EligibleDriver {
  id: string;
  firstName: string;
  lastName: string;
  currentCity: string | null;
  currentState: string | null;
  status: string;
  timezone: string | null;
}

export interface EligibleDriverQueryPort {
  findActiveDriversForOrg(organizationId: string): Promise<EligibleDriver[]>;
}

// ---------------------------------------------------------------------------
// Internal query port (load pickup)
// ---------------------------------------------------------------------------

export interface LoadPickupQueryPort {
  getFirstPickup(loadId: string): Promise<PickupDetails | null>;
}
