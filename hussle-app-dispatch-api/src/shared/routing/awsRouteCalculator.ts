import { GeoRoutesClient, CalculateRoutesCommand } from '@aws-sdk/client-geo-routes';
import type { Logger } from '@/shared/utils/logger';
import type { RouteCalculatorPort } from './routeCalculatorPort';
import type { Coordinates, RouteLeg, RouteResult } from './types';

const METERS_PER_KILOMETER = 1000;

interface AwsRouteCalculatorDeps {
  routesClient: GeoRoutesClient;
  logger: Logger;
}

const toLngLatTuple = (coord: Coordinates): [number, number] => [coord.lng, coord.lat];

const toLineString = (linestring: number[][] | undefined): [number, number][] =>
  (linestring ?? []).map((point) => [point[0] ?? 0, point[1] ?? 0]);

export const createAwsRouteCalculator = (deps: AwsRouteCalculatorDeps): RouteCalculatorPort => ({
  calculateRoute: async (waypoints: Coordinates[]): Promise<RouteResult> => {
    const { routesClient, logger } = deps;

    const departure = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const middleWaypoints = waypoints.slice(1, -1);

    if (!departure || !destination) {
      throw new Error('At least two waypoints are required to calculate a route');
    }

    const command = new CalculateRoutesCommand({
      Origin: toLngLatTuple(departure),
      Destination: toLngLatTuple(destination),
      Waypoints: middleWaypoints.map((wp) => ({ Position: toLngLatTuple(wp) })),
      TravelMode: 'Truck',
      LegGeometryFormat: 'Simple',
    });

    try {
      const response = await routesClient.send(command);
      const route = response.Routes?.[0];

      if (!route) {
        throw new Error('Route calculation returned no routes');
      }

      const legs: RouteLeg[] = (route.Legs ?? []).map((leg) => {
        const overview = leg.VehicleLegDetails?.Summary?.Overview;
        return {
          distanceKm: (overview?.Distance ?? 0) / METERS_PER_KILOMETER,
          durationSeconds: overview?.Duration ?? 0,
          geometry: toLineString(leg.Geometry?.LineString),
        };
      });

      const totalDistanceMeters =
        route.Summary?.Distance ?? legs.reduce((sum, leg) => sum + leg.distanceKm * METERS_PER_KILOMETER, 0);

      return {
        totalDistanceKm: totalDistanceMeters / METERS_PER_KILOMETER,
        legs,
        stateMiles: [],
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown AWS Location error';
      logger.warn('AWS Location route calculation failed', {
        waypointCount: waypoints.length,
        error: message,
      });
      throw error;
    }
  },
});
