import { NotFoundError } from '@/shared/errors';
import { haversineDistance } from '@/shared/geoLookup';
import type {
  DeadheadToResult,
  DeadheadToServiceDeps,
  DeadheadToServiceInput,
} from '../types/deadheadToTypes';

const ROAD_FACTOR = 1.3;

const NO_LOCATION_RESULT: DeadheadToResult = {
  deadheadMiles: null,
  isEstimated: false,
  source: null,
};

export const calculateDeadheadTo = async (
  input: DeadheadToServiceInput,
  deps: DeadheadToServiceDeps,
): Promise<DeadheadToResult> => {
  const driver = await deps.findDriver(input.driverId, input.organizationId);

  if (driver === null) {
    throw new NotFoundError('Driver not found.');
  }

  const targetCoords = { lat: input.targetLat, lng: input.targetLng };

  if (driver.currentLatitude !== null && driver.currentLongitude !== null) {
    const fromCoords = {
      lat: Number(driver.currentLatitude),
      lng: Number(driver.currentLongitude),
    };
    const miles = haversineDistance({ from: fromCoords, to: targetCoords }) * ROAD_FACTOR;

    return {
      deadheadMiles: Math.round(miles),
      isEstimated: true,
      source: 'coordinates',
    };
  }

  if (driver.currentCity !== null && driver.currentState !== null) {
    const cityCoords = await deps.getCityCoords(
      deps.redis,
      driver.currentState,
      driver.currentCity,
    );

    if (cityCoords === null) {
      return NO_LOCATION_RESULT;
    }

    const miles = haversineDistance({ from: cityCoords, to: targetCoords }) * ROAD_FACTOR;

    return {
      deadheadMiles: Math.round(miles),
      isEstimated: true,
      source: 'geocoded',
    };
  }

  return NO_LOCATION_RESULT;
};
