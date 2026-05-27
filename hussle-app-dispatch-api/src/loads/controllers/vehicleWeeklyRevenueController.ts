import type { Request, RequestHandler, Response } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { WeeklyGrossService } from '../services/weeklyGrossService';
import { vehicleWeeklyRevenueMapper } from './mappers/vehicleWeeklyRevenueMapper';
import { toVehicleWeeklyRevenueResponse } from './transformers/vehicleWeeklyRevenueTransformer';

interface VehicleWeeklyRevenueControllerDeps {
  weeklyGrossService: WeeklyGrossService;
}

export const createVehicleWeeklyRevenueController = (
  deps: VehicleWeeklyRevenueControllerDeps,
): RequestHandler =>
  async (req: Request, res: Response): Promise<void> => {
    const input = vehicleWeeklyRevenueMapper(req);
    const points = await deps.weeklyGrossService.getVehicleWeeklyRevenue(input);
    sendSingle(res, toVehicleWeeklyRevenueResponse(points));
  };
