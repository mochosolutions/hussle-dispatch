import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { sendList, sendSingle } from '@/shared/responseEnvelope';
import type { VehicleService } from '../types/vehicleServiceTypes';
import { createVehicleMapper } from './mappers/createVehicleMapper';
import { getRequestContextMapper } from './mappers/getRequestContextMapper';
import { getRequiredVehicleIdMapper } from './mappers/getRequiredVehicleIdMapper';
import { listVehiclesMapper } from './mappers/listVehiclesMapper';
import { updateVehicleMapper } from './mappers/updateVehicleMapper';
import { toVehicleListEnvelope, toVehicleResponse } from './transformers/vehicleTransformer';

interface VehicleControllerDeps {
  vehicleService: VehicleService;
}

export interface VehicleControllers {
  createVehicle: RequestHandler;
  listVehicles: RequestHandler;
  getVehicleById: RequestHandler;
  updateVehicle: RequestHandler;
  deleteVehicle: RequestHandler;
}

export const createVehicleControllers = (deps: VehicleControllerDeps): VehicleControllers => ({
  createVehicle: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = createVehicleMapper(req);
    const vehicle = await deps.vehicleService.createVehicle(serviceInput);
    sendSingle(res, toVehicleResponse(vehicle), 201);
  },

  listVehicles: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = listVehiclesMapper(req);
    const result = await deps.vehicleService.listVehicles(serviceInput);
    const response = toVehicleListEnvelope(result.data, result.meta);
    sendList(res, response.data, response.meta);
  },

  getVehicleById: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredVehicleIdMapper(req);
    const vehicle = await deps.vehicleService.getVehicleById({
      ...context,
      id,
    });
    sendSingle(res, toVehicleResponse(vehicle));
  },

  updateVehicle: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = updateVehicleMapper(req);
    const vehicle = await deps.vehicleService.updateVehicle(serviceInput);
    sendSingle(res, toVehicleResponse(vehicle));
  },

  deleteVehicle: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredVehicleIdMapper(req);

    await deps.vehicleService.deleteVehicle({
      ...context,
      id,
    });

    res.status(204).send();
  },
});
