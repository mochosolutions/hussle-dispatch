import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { sendList, sendSingle } from '@/shared/responseEnvelope';
import type { DriverService } from '../types/driverServiceTypes';
import { createDriverMapper } from './mappers/createDriverMapper';
import { getRequiredDriverIdMapper } from './mappers/getRequiredDriverIdMapper';
import { getRequestContextMapper } from './mappers/getRequestContextMapper';
import { listDriversMapper } from './mappers/listDriversMapper';
import { updateDriverMapper } from './mappers/updateDriverMapper';
import { toDriverListEnvelope, toDriverResponse } from './transformers/driverTransformer';

interface DriverControllerDeps {
  driverService: DriverService;
}

export interface DriverControllers {
  createDriver: RequestHandler;
  listDrivers: RequestHandler;
  getDriverById: RequestHandler;
  updateDriver: RequestHandler;
  deleteDriver: RequestHandler;
}

export const createDriverControllers = (deps: DriverControllerDeps): DriverControllers => ({
  createDriver: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = createDriverMapper(req);
    const driver = await deps.driverService.createDriver(serviceInput);
    sendSingle(res, toDriverResponse(driver), 201);
  },

  listDrivers: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = listDriversMapper(req);
    const result = await deps.driverService.listDrivers(serviceInput);
    const response = toDriverListEnvelope(result.data, result.meta);
    sendList(res, response.data, response.meta);
  },

  getDriverById: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredDriverIdMapper(req);
    const driver = await deps.driverService.getDriverById({
      ...context,
      id,
    });
    sendSingle(res, toDriverResponse(driver));
  },

  updateDriver: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = updateDriverMapper(req);
    const driver = await deps.driverService.updateDriver(serviceInput);
    sendSingle(res, toDriverResponse(driver));
  },

  deleteDriver: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredDriverIdMapper(req);
    await deps.driverService.deleteDriver({
      ...context,
      id,
    });

    res.status(204).send();
  },
});
