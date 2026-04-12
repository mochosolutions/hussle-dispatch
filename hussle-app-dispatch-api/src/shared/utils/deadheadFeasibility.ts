import { haversineDistance } from '../geoLookup';

const ROAD_FACTOR = 1.3;
const AVERAGE_SPEED_MPH = 55;
const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;
const GREEN_THRESHOLD_MINUTES = 60;

interface Coordinates {
  lat: number;
  lng: number;
}

interface DeadheadInput {
  driverCoords: Coordinates;
  pickupCoords: Coordinates;
  targetArrivalUtc: Date;
  nowUtc: Date;
}

type FeasibilityStatus = 'GREEN' | 'YELLOW' | 'RED';

interface DeadheadResult {
  deadheadMiles: number;
  estimatedDriveMinutes: number;
  estimatedArrivalUtc: Date;
  bufferMinutes: number;
  status: FeasibilityStatus;
}

const determineFeasibilityStatus = (bufferMinutes: number): FeasibilityStatus => {
  if (bufferMinutes >= GREEN_THRESHOLD_MINUTES) {
    return 'GREEN';
  }
  if (bufferMinutes >= 0) {
    return 'YELLOW';
  }
  return 'RED';
};

export const calculateDeadheadFeasibility = (input: DeadheadInput): DeadheadResult => {
  const straightLineMiles = haversineDistance({
    from: input.driverCoords,
    to: input.pickupCoords,
  });

  const deadheadMiles = Math.round(straightLineMiles * ROAD_FACTOR * 10) / 10;
  const estimatedDriveMinutes = Math.round((deadheadMiles / AVERAGE_SPEED_MPH) * MINUTES_PER_HOUR);
  const estimatedArrivalUtc = new Date(
    input.nowUtc.getTime() + estimatedDriveMinutes * MS_PER_MINUTE,
  );
  const bufferMinutes = Math.round(
    (input.targetArrivalUtc.getTime() - estimatedArrivalUtc.getTime()) / MS_PER_MINUTE,
  );
  const status = determineFeasibilityStatus(bufferMinutes);

  return {
    deadheadMiles,
    estimatedDriveMinutes,
    estimatedArrivalUtc,
    bufferMinutes,
    status,
  };
};

export type { Coordinates, DeadheadInput, DeadheadResult, FeasibilityStatus };
