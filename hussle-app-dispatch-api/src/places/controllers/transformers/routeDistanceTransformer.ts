import type { RouteDistanceOutput } from '../../services/routeDistanceService';

interface RouteLegResponse {
  distanceMiles: number;
  durationMinutes: number;
  isEstimated: boolean;
}

export interface RouteDistanceResponse {
  legs: RouteLegResponse[];
  totalMiles: number;
  totalMinutes: number;
  isEstimated: boolean;
}

export const toRouteDistanceResponse = (
  result: RouteDistanceOutput,
): RouteDistanceResponse => ({
  legs: result.legs.map((leg) => ({
    distanceMiles: leg.distanceMiles,
    durationMinutes: leg.durationMinutes,
    isEstimated: leg.isEstimated,
  })),
  totalMiles: result.totalMiles,
  totalMinutes: result.totalMinutes,
  isEstimated: result.isEstimated,
});
