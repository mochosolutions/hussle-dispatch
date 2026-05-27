import type { Request, Response, RequestHandler } from 'express';
import { UnauthorizedError } from '@/shared/errors/commonErrors';
import { sendSingle, sendList } from '@/shared/responseEnvelope';
import type { ExpenseServicePort } from '../types/expenseTypes';
import type { VehicleTokenContext } from '../types/vehicleTokenTypes';
import type { VehicleOrgQueryPort } from '../repositories/vehicleOrgQueryPrisma';
import {
  driverPortalCreateExpenseMapper,
  driverPortalListExpensesMapper,
  driverPortalUpdateExpenseMapper,
} from './mappers/driverPortalExpenseMapper';
import { toExpenseResponse, toExpenseListResponse } from './transformers/expenseTransformer';

interface DriverPortalExpenseControllerDeps {
  expenseService: ExpenseServicePort;
  vehicleOrgQuery: VehicleOrgQueryPort;
}

export interface DriverPortalExpenseControllers {
  createExpense: RequestHandler;
  listExpenses: RequestHandler;
  editExpense: RequestHandler;
}

const getVehicleExpense = (req: Request): VehicleTokenContext => {
  if (!req.vehicleExpense) {
    throw new UnauthorizedError('Missing vehicle expense context');
  }
  return req.vehicleExpense;
};

export const createDriverPortalExpenseControllers = (
  deps: DriverPortalExpenseControllerDeps,
): DriverPortalExpenseControllers => ({
  createExpense: async (req: Request, res: Response): Promise<void> => {
    const ctx = getVehicleExpense(req);
    const organizationId = await deps.vehicleOrgQuery.findOrganizationId(ctx.vehicleId);
    const input = driverPortalCreateExpenseMapper(req, ctx, organizationId);
    const expense = await deps.expenseService.createExpense(input);
    sendSingle(res, toExpenseResponse(expense), 201);
  },

  listExpenses: async (req: Request, res: Response): Promise<void> => {
    const ctx = getVehicleExpense(req);
    const organizationId = await deps.vehicleOrgQuery.findOrganizationId(ctx.vehicleId);
    const input = driverPortalListExpensesMapper(req, ctx, organizationId);
    const result = await deps.expenseService.listExpenses(input);
    const response = toExpenseListResponse(result.data, result.meta);
    sendList(res, { data: response.data, meta: response.meta });
  },

  editExpense: async (req: Request, res: Response): Promise<void> => {
    const ctx = getVehicleExpense(req);
    const organizationId = await deps.vehicleOrgQuery.findOrganizationId(ctx.vehicleId);
    const input = driverPortalUpdateExpenseMapper(req, ctx, organizationId);
    const expense = await deps.expenseService.updateExpense(input);
    sendSingle(res, toExpenseResponse(expense));
  },
});
