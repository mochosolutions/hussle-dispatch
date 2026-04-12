import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { sendList, sendSingle } from '@/shared/responseEnvelope';
import type { DeadheadToResult, DeadheadToServiceInput } from '../types/deadheadToTypes';
import type { DriverService } from '../types/driverServiceTypes';
import { createDriverMapper } from './mappers/createDriverMapper';
import { deadheadToMapper } from './mappers/deadheadToMapper';
import { getDriverLoadHistoryMapper } from './mappers/getDriverLoadHistoryMapper';
import { getRequiredDriverIdMapper } from './mappers/getRequiredDriverIdMapper';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { listDriversMapper } from './mappers/listDriversMapper';
import { updateDriverMapper } from './mappers/updateDriverMapper';
import {
  toDriverDetailResponse,
  toDriverListEnvelope,
  toDriverResponse,
} from './transformers/driverTransformer';
import {
  toLoadHistoryItemResponse,
  toLoadPerformanceMetricsResponse,
} from './transformers/loadHistoryTransformer';

interface DriverControllerDeps {
  driverService: DriverService;
  deadheadToService: (input: DeadheadToServiceInput) => Promise<DeadheadToResult>;
}

export interface DriverControllers {
  createDriver: RequestHandler;
  listDrivers: RequestHandler;
  getDriverById: RequestHandler;
  updateDriver: RequestHandler;
  deleteDriver: RequestHandler;
  getLoadHistory: RequestHandler;
  getDeadheadTo: RequestHandler;
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
    sendList(res, { data: response.data, meta: response.meta });
  },

  getDriverById: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredDriverIdMapper(req);
    const driver = await deps.driverService.getDriverById({
      ...context,
      id,
    });
    sendSingle(res, toDriverDetailResponse(driver));
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

  getLoadHistory: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = getDriverLoadHistoryMapper(req);
    const result = await deps.driverService.getLoadHistory({
      id: serviceInput.driverId,
      organizationId: serviceInput.organizationId,
      role: serviceInput.role,
      query: serviceInput.query,
    });
    const data = result.data.map(toLoadHistoryItemResponse);
    const metrics = toLoadPerformanceMetricsResponse(result.metrics);
    res.status(200).json({ data, meta: result.meta, metrics });
  },

  getDeadheadTo: async (req: Request, res: Response): Promise<void> => {
    const input = deadheadToMapper(req);
    const result = await deps.deadheadToService(input);
    sendSingle(res, result);
  },
});
