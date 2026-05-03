import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { StopService } from '../services/stopService';
import { createStopMapper } from './mappers/createStopMapper';
import { updateStopMapper } from './mappers/updateStopMapper';
import { reorderStopsMapper } from './mappers/reorderStopsMapper';
import { toStopResponse, toStopListResponse } from './transformers/stopTransformer';

interface StopControllerDeps {
  stopService: StopService;
}

export interface StopControllers {
  create: RequestHandler;
  update: RequestHandler;
  remove: RequestHandler;
  list: RequestHandler;
  reorder: RequestHandler;
}

export const createStopControllers = (deps: StopControllerDeps): StopControllers => ({
  create: async (req: Request, res: Response): Promise<void> => {
    const input = createStopMapper(req);
    const result = await deps.stopService.createStop(input);
    res.status(201).json({
      data: toStopResponse(result.stop),
      warnings: result.warnings,
    });
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const input = updateStopMapper(req);
    const result = await deps.stopService.updateStop(input);
    res.status(200).json({
      data: toStopResponse(result.stop),
      warnings: result.warnings,
    });
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.organizationId ?? '';
    const stopId = req.params['stopId'] ?? '';

    await deps.stopService.deleteStop(stopId, organizationId);
    res.status(204).send();
  },

  list: async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.organizationId ?? '';
    const loadId = req.params['loadId'] ?? '';

    const stops = await deps.stopService.listStops(loadId, organizationId);
    sendSingle(res, toStopListResponse(stops));
  },

  reorder: async (req: Request, res: Response): Promise<void> => {
    const input = reorderStopsMapper(req);
    await deps.stopService.reorderStops(input);
    res.status(200).json({ data: { success: true } });
  },
});
