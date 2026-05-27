import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import type { RouteDistanceOutput } from '../services/routeDistanceService';
import { routeDistanceMapper } from './mappers/routeDistanceMapper';
import { toRouteDistanceResponse } from './transformers/routeDistanceTransformer';
import { sendSingle } from '@/shared/responseEnvelope';

interface RouteDistanceService {
  calculateDistance(waypoints: { lat: number; lng: number }[]): Promise<RouteDistanceOutput>;
}

interface RouteDistanceControllerDeps {
  routeDistanceService: RouteDistanceService;
}

export const createRouteDistanceController = (
  deps: RouteDistanceControllerDeps,
): RequestHandler =>
  async (req: Request, res: Response): Promise<void> => {
    const input = routeDistanceMapper(req);
    const result = await deps.routeDistanceService.calculateDistance(input.waypoints);
    sendSingle(res, toRouteDistanceResponse(result));
  };
