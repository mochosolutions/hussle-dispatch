import express from 'express';
import { requireAuth } from '@/middleware/auth';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { RecurringExpenseControllers } from '../controllers/recurringExpenseController';
import {
  createRecurringExpenseValidator,
  updateRecurringExpenseValidator,
  listRecurringExpensesValidator,
  generateRecurringValidator,
  recurringExpenseIdValidator,
} from '../validators/recurringExpenseValidators';

export const createRecurringExpenseRouter = (
  controllers: RecurringExpenseControllers,
): express.Router => {
  const router = express.Router();

  router.post(
    '/',
    requireAuth,
    validateRequest(createRecurringExpenseValidator),
    controllers.create,
  );

  router.get(
    '/',
    requireAuth,
    validateRequest(listRecurringExpensesValidator),
    controllers.list,
  );

  router.post(
    '/generate',
    requireAuth,
    validateRequest(generateRecurringValidator),
    controllers.generate,
  );

  router.patch(
    '/:id',
    requireAuth,
    validateRequest(updateRecurringExpenseValidator),
    controllers.update,
  );

  router.delete(
    '/:id',
    requireAuth,
    validateRequest(recurringExpenseIdValidator),
    controllers.deactivate,
  );

  return router;
};
