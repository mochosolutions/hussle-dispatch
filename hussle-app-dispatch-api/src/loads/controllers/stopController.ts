import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import { UnauthorizedError } from '@/shared/errors';
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
    const stop = await deps.stopService.createStop(input);
    sendSingle(res, toStopResponse(stop), 201);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const input = updateStopMapper(req);
    const stop = await deps.stopService.updateStop(input);
    sendSingle(res, toStopResponse(stop));
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.organizationId;
    const stopId = req.params['stopId'];

    if (organizationId === undefined || stopId === undefined) {
      throw new UnauthorizedError('Authentication required');
    }

    await deps.stopService.deleteStop(stopId, organizationId);
    res.status(204).send();
  },

  list: async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.organizationId;
    const loadId = req.params['loadId'];

    if (organizationId === undefined || loadId === undefined) {
      throw new UnauthorizedError('Authentication required');
    }

    const stops = await deps.stopService.listStops(loadId, organizationId);
    sendSingle(res, toStopListResponse(stops));
  },

  reorder: async (req: Request, res: Response): Promise<void> => {
    const input = reorderStopsMapper(req);
    await deps.stopService.reorderStops(input);
    res.status(200).json({ data: { success: true } });
  },
});
