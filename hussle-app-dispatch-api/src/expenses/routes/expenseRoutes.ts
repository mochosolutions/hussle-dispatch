import express from 'express';
import { requireAuth } from '@/middleware/auth';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { ExpenseControllers } from '../controllers/expenseController';
import type { ReceiptControllers } from '../controllers/receiptController';
import {
  createExpenseValidator,
  deleteExpenseValidator,
  getExpenseValidator,
  listExpensesValidator,
  updateExpenseValidator,
  presignReceiptValidator,
  confirmReceiptValidator,
} from '../validators/expenseValidators';

interface ExpenseRouterControllers {
  expense: ExpenseControllers;
  receipt: ReceiptControllers;
}

export const createExpenseRouter = (controllers: ExpenseRouterControllers): express.Router => {
  const router = express.Router();

  router.post(
    '/',
    requireAuth,
    validateRequest(createExpenseValidator),
    controllers.expense.create,
  );

  router.get('/', requireAuth, validateRequest(listExpensesValidator), controllers.expense.list);

  router.get(
    '/:id',
    requireAuth,
    validateRequest(getExpenseValidator),
    controllers.expense.getById,
  );

  router.patch(
    '/:id',
    requireAuth,
    validateRequest(updateExpenseValidator),
    controllers.expense.update,
  );

  router.delete(
    '/:id',
    requireAuth,
    validateRequest(deleteExpenseValidator),
    controllers.expense.softDelete,
  );

  // Receipt upload
  router.post(
    '/:id/receipt',
    requireAuth,
    validateRequest(presignReceiptValidator),
    controllers.receipt.presignReceipt,
  );

  router.post(
    '/:id/receipt/confirm',
    requireAuth,
    validateRequest(confirmReceiptValidator),
    controllers.receipt.confirmReceipt,
  );

  return router;
};
