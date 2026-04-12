import type { Coordinates, RouteResult } from './types';

export interface RouteCalculatorPort {
  calculateRoute(waypoints: Coordinates[]): Promise<RouteResult>;
}
