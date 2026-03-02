import { SCORING_WEIGHTS } from '../constants/scoringWeights';

/**
 * Input for driver fit scoring.
 */
export interface DriverFitInput {
  preferredLanes: string[];
  noGoZones: string[];
  homeBase: string;
  destination: string;
  maxDaysOut: number;
  currentDaysOut: number;
  milesFromHome: number;
}

/**
 * Result from driver fit scoring.
 */
export interface DriverFitResult {
  isPreferredLane: boolean;
  isNoGoZone: boolean;
  milesFromHome: number;
  daysFromHome: number;
  exceedsMaxDaysOut: boolean;
  points: number;
}

const MAX_POINTS = SCORING_WEIGHTS.composite.driverFit;

/**
 * Distance threshold beyond which points decay to 0 (in miles).
 * Loads within this radius score proportionally higher.
 */
const MAX_DISTANCE_FOR_POINTS = 1500;

/**
 * Calculates driver fit score (0-30) for a load based on lane preference,
 * no-go zones, distance from home, and days-out constraints.
 *
 * Preferred lane match = max points (30).
 * No-go zone = 0 points.
 * Otherwise = distance-based linear decay.
 */
export const calculateDriverFit = (input: DriverFitInput): DriverFitResult => {
  const {
    preferredLanes,
    noGoZones,
    destination,
    maxDaysOut,
    currentDaysOut,
    milesFromHome,
  } = input;

  const isPreferredLane = preferredLanes.includes(destination);
  const isNoGoZone = noGoZones.includes(destination);
  const exceedsMaxDaysOut = currentDaysOut > maxDaysOut;

  let points: number;

  if (isNoGoZone) {
    points = 0;
  } else if (isPreferredLane) {
    points = MAX_POINTS;
  } else {
    // Distance-based decay: closer to home = more points
    const distanceRatio = Math.min(milesFromHome / MAX_DISTANCE_FOR_POINTS, 1);
    const rawPoints = MAX_POINTS * (1 - distanceRatio);

    // Apply days-out penalty: reduce by 20% for each day over the limit
    const daysOverLimit = Math.max(currentDaysOut - maxDaysOut, 0);
    const daysPenalty = daysOverLimit > 0 ? 0.5 : 1;

    points = Math.max(0, Math.round(rawPoints * daysPenalty));
  }

  return {
    isPreferredLane,
    isNoGoZone,
    milesFromHome,
    daysFromHome: currentDaysOut,
    exceedsMaxDaysOut,
    points,
  };
};
