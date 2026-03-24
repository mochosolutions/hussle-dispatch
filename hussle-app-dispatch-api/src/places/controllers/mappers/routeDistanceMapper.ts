import type { Request } from 'express';

interface Waypoint {
  lat: number;
  lng: number;
}

export interface RouteDistanceInput {
  waypoints: Waypoint[];
}

export const routeDistanceMapper = (req: Request): RouteDistanceInput => {
  const body: { waypoints: Waypoint[] } = req.body;

  return {
    waypoints: body.waypoints,
  };
};
