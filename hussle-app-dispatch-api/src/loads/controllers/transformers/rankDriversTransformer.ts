import type { RankedDriver } from '../../types/rankDriverTypes';

export interface RankedDriverResponse {
  driverId: string;
  driverName: string;
  currentLocation: string | null;
  deadheadMiles: number;
  estimatedDriveMinutes: number;
  estimatedArrivalUtc: string;
  bufferMinutes: number;
  feasibilityStatus: string;
  scheduleAvailable: boolean;
  driverStatus: string;
  hasConflictingLoad: boolean;
  driverFitPoints: number;
}

export const toRankedDriverResponse = (driver: RankedDriver): RankedDriverResponse => ({
  driverId: driver.driverId,
  driverName: driver.driverName,
  currentLocation: driver.currentLocation,
  deadheadMiles: driver.deadheadMiles,
  estimatedDriveMinutes: driver.estimatedDriveMinutes,
  estimatedArrivalUtc: driver.estimatedArrivalUtc.toISOString(),
  bufferMinutes: driver.bufferMinutes,
  feasibilityStatus: driver.feasibilityStatus,
  scheduleAvailable: driver.scheduleAvailable,
  driverStatus: driver.driverStatus,
  hasConflictingLoad: driver.hasConflictingLoad,
  driverFitPoints: driver.driverFitPoints,
});

export const toRankedDriverListResponse = (
  drivers: RankedDriver[],
): RankedDriverResponse[] => drivers.map(toRankedDriverResponse);
