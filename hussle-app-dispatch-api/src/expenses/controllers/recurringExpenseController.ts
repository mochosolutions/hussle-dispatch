import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { RecurringExpenseServicePort } from '../types/recurringExpenseTypes';
import { createRecurringExpenseMapper } from './mappers/createRecurringExpenseMapper';
import { updateRecurringExpenseMapper } from './mappers/updateRecurringExpenseMapper';
import { listRecurringExpensesMapper } from './mappers/listRecurringExpensesMapper';
import { generateRecurringMapper } from './mappers/generateRecurringMapper';
import { recurringExpenseIdMapper } from './mappers/recurringExpenseIdMapper';
import {
  toRecurringExpenseResponse,
  toRecurringExpenseListResponse,
} from './transformers/recurringExpenseTransformer';

interface RecurringExpenseControllerDeps {
  recurringExpenseService: RecurringExpenseServicePort;
}

export interface RecurringExpenseControllers {
  create: RequestHandler;
  list: RequestHandler;
  update: RequestHandler;
  deactivate: RequestHandler;
  generate: RequestHandler;
}

export const createRecurringExpenseControllers = (
  deps: RecurringExpenseControllerDeps,
): RecurringExpenseControllers => ({
  create: async (req: Request, res: Response): Promise<void> => {
    const input = createRecurringExpenseMapper(req);
    const recurringExpense = await deps.recurringExpenseService.create(input);
    sendSingle(res, toRecurringExpenseResponse(recurringExpense), 201);
  },

  list: async (req: Request, res: Response): Promise<void> => {
    const input = listRecurringExpensesMapper(req);
    const recurringExpenses = await deps.recurringExpenseService.list(input);
    sendSingle(res, toRecurringExpenseListResponse(recurringExpenses));
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const input = updateRecurringExpenseMapper(req);
    const recurringExpense = await deps.recurringExpenseService.update(input);
    sendSingle(res, toRecurringExpenseResponse(recurringExpense));
  },

  deactivate: async (req: Request, res: Response): Promise<void> => {
    const input = recurringExpenseIdMapper(req);
    await deps.recurringExpenseService.deactivate(input);
    res.status(204).end();
  },

  generate: async (req: Request, res: Response): Promise<void> => {
    const input = generateRecurringMapper(req);
    const result = await deps.recurringExpenseService.generate(input);
    sendSingle(res, result);
  },
});
