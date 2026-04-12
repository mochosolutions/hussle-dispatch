import { LocationClient, CalculateRouteCommand } from '@aws-sdk/client-location';
import type { Logger } from '@/shared/utils/logger';
import type { RouteCalculatorPort } from './routeCalculatorPort';
import type { Coordinates, RouteLeg, RouteResult } from './types';

interface AwsRouteCalculatorDeps {
  locationClient: LocationClient;
  calculatorName: string;
  logger: Logger;
}

export const createAwsRouteCalculator = (deps: AwsRouteCalculatorDeps): RouteCalculatorPort => ({
  calculateRoute: async (waypoints: Coordinates[]): Promise<RouteResult> => {
    const { locationClient, calculatorName, logger } = deps;

    const departure = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const middleWaypoints = waypoints.slice(1, -1);

    if (!departure || !destination) {
      throw new Error('At least two waypoints are required to calculate a route');
    }

    const command = new CalculateRouteCommand({
      CalculatorName: calculatorName,
      DeparturePosition: [departure.lng, departure.lat],
      DestinationPosition: [destination.lng, destination.lat],
      WaypointPositions: middleWaypoints.map((wp) => [wp.lng, wp.lat]),
      TravelMode: 'Truck',
      DistanceUnit: 'Kilometers',
      IncludeLegGeometry: true,
    });

    try {
      const response = await locationClient.send(command);

      const legs: RouteLeg[] = (response.Legs ?? []).map((leg) => ({
        distanceKm: leg.Distance ?? 0,
        durationSeconds: leg.DurationSeconds ?? 0,
        geometry: (leg.Geometry?.LineString ?? []).map(
          (point) => [point[0] ?? 0, point[1] ?? 0] as [number, number],
        ),
      }));

      const totalDistanceKm = response.Summary?.Distance ?? legs.reduce(
        (sum, leg) => sum + leg.distanceKm,
        0,
      );

      return {
        totalDistanceKm,
        legs,
        stateMiles: [],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown AWS Location error';
      logger.warn('AWS Location route calculation failed', {
        calculatorName,
        waypointCount: waypoints.length,
        error: message,
      });
      throw error;
    }
  },
});
