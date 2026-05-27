import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { sendList, sendSingle } from '@/shared/responseEnvelope';
import type { VehicleService } from '../types/vehicleServiceTypes';
import { assignDriverMapper } from './mappers/assignDriverMapper';
import { createExpenseMapper } from './mappers/createExpenseMapper';
import { createVehicleMapper } from './mappers/createVehicleMapper';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { getRequiredVehicleIdMapper } from './mappers/getRequiredVehicleIdMapper';
import { getVehicleLoadHistoryMapper } from './mappers/getVehicleLoadHistoryMapper';
import { listExpensesMapper } from './mappers/listExpensesMapper';
import { listVehiclesMapper } from './mappers/listVehiclesMapper';
import { updateVehicleMapper } from './mappers/updateVehicleMapper';
import { toExpenseListResponse, toExpenseResponse } from './transformers/expenseTransformer';
import { toVehicleListEnvelope, toVehicleResponse } from './transformers/vehicleTransformer';
import {
  toLoadHistoryItemResponse,
  toLoadPerformanceMetricsResponse,
} from './transformers/loadHistoryTransformer';

interface VehicleControllerDeps {
  vehicleService: VehicleService;
}

export interface VehicleControllers {
  createVehicle: RequestHandler;
  listVehicles: RequestHandler;
  getVehicleById: RequestHandler;
  updateVehicle: RequestHandler;
  deleteVehicle: RequestHandler;
  assignDriver: RequestHandler;
  unassignDriver: RequestHandler;
  getLoadHistory: RequestHandler;
  createExpense: RequestHandler;
  listExpenses: RequestHandler;
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
    sendList(res, { data: response.data, meta: response.meta });
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

  assignDriver: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = assignDriverMapper(req);
    const vehicle = await deps.vehicleService.assignDriver(serviceInput);
    sendSingle(res, toVehicleResponse(vehicle));
  },

  unassignDriver: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredVehicleIdMapper(req);
    const vehicle = await deps.vehicleService.unassignDriver({
      ...context,
      id,
    });
    sendSingle(res, toVehicleResponse(vehicle));
  },

  getLoadHistory: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = getVehicleLoadHistoryMapper(req);
    const result = await deps.vehicleService.getLoadHistory(serviceInput);
    const data = result.data.map(toLoadHistoryItemResponse);
    const metrics = toLoadPerformanceMetricsResponse(result.metrics);
    res.status(200).json({ data, meta: result.meta, metrics });
  },

  createExpense: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = createExpenseMapper(req);
    const expense = await deps.vehicleService.createExpense(serviceInput);
    sendSingle(res, toExpenseResponse(expense), 201);
  },

  listExpenses: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = listExpensesMapper(req);
    const expenses = await deps.vehicleService.listExpenses(serviceInput);
    res.status(200).json({ data: toExpenseListResponse(expenses) });
  },
});
