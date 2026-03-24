import type {
  RouteDistanceResult,
  RoutingProviderPort,
} from '@/shared/providers/awsLocationProviderTypes';

interface Waypoint {
  lat: number;
  lng: number;
}

interface FallbackCalculator {
  calculateRoadDistance: (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => number;
}

interface RouteDistanceServiceDeps {
  routingProvider: RoutingProviderPort;
  fallbackCalculator: FallbackCalculator;
  routeCalculatorEnabled: boolean;
}

export interface RouteDistanceOutput {
  legs: RouteDistanceResult[];
  totalMiles: number;
  totalMinutes: number;
  isEstimated: boolean;
}

const calculateFallbackLeg = (
  origin: Waypoint,
  destination: Waypoint,
  fallbackCalculator: FallbackCalculator,
): RouteDistanceResult => ({
  distanceMiles: fallbackCalculator.calculateRoadDistance(origin, destination),
  durationMinutes: 0,
  isEstimated: true,
});

export const createRouteDistanceService = (deps: RouteDistanceServiceDeps) => ({
  calculateDistance: async (waypoints: Waypoint[]): Promise<RouteDistanceOutput> => {
    const legs: RouteDistanceResult[] = [];

    for (let i = 0; i < waypoints.length - 1; i += 1) {
      const origin = waypoints[i];
      const destination = waypoints[i + 1];

      if (origin === undefined || destination === undefined) {
        continue;
      }

      if (!deps.routeCalculatorEnabled) {
        legs.push(calculateFallbackLeg(origin, destination, deps.fallbackCalculator));
        continue;
      }

      try {
        const leg = await deps.routingProvider.calculateRoute(origin, destination);
        legs.push(leg);
      } catch {
        legs.push(calculateFallbackLeg(origin, destination, deps.fallbackCalculator));
      }
    }

    let totalMiles = 0;
    let totalMinutes = 0;
    let isEstimated = false;

    legs.forEach((leg) => {
      totalMiles += leg.distanceMiles;
      totalMinutes += leg.durationMinutes;
      if (leg.isEstimated) {
        isEstimated = true;
      }
    });

    return {
      legs,
      totalMiles: Math.round(totalMiles * 100) / 100,
      totalMinutes: Math.round(totalMinutes * 100) / 100,
      isEstimated,
    };
  },
});
