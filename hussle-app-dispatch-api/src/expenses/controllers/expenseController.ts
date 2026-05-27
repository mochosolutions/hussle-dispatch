import type { Request, Response, RequestHandler } from 'express';
import { sendSingle, sendList } from '@/shared/responseEnvelope';
import type { ExpenseServicePort } from '../types/expenseTypes';
import { createExpenseMapper } from './mappers/createExpenseMapper';
import { updateExpenseMapper } from './mappers/updateExpenseMapper';
import { listExpensesMapper } from './mappers/listExpensesMapper';
import { expenseIdMapper } from './mappers/expenseIdMapper';
import { toExpenseResponse, toExpenseListResponse } from './transformers/expenseTransformer';

interface ExpenseControllerDeps {
  expenseService: ExpenseServicePort;
}

export interface ExpenseControllers {
  create: RequestHandler;
  list: RequestHandler;
  getById: RequestHandler;
  update: RequestHandler;
  softDelete: RequestHandler;
}

export const createExpenseControllers = (deps: ExpenseControllerDeps): ExpenseControllers => ({
  create: async (req: Request, res: Response): Promise<void> => {
    const input = createExpenseMapper(req);
    const expense = await deps.expenseService.createExpense(input);
    sendSingle(res, toExpenseResponse(expense), 201);
  },

  list: async (req: Request, res: Response): Promise<void> => {
    const input = listExpensesMapper(req);
    const result = await deps.expenseService.listExpenses(input);
    const response = toExpenseListResponse(result.data, result.meta);
    sendList(res, { data: response.data, meta: response.meta });
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const input = expenseIdMapper(req);
    const expense = await deps.expenseService.getExpenseById(input);
    sendSingle(res, toExpenseResponse(expense));
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const input = updateExpenseMapper(req);
    const expense = await deps.expenseService.updateExpense(input);
    sendSingle(res, toExpenseResponse(expense));
  },

  softDelete: async (req: Request, res: Response): Promise<void> => {
    const input = expenseIdMapper(req);
    await deps.expenseService.softDeleteExpense(input);
    res.status(204).end();
  },
});
