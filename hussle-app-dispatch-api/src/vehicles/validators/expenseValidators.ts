import { ExpenseCategory } from '@prisma/client';
import * as Yup from 'yup';

const expenseCategoryValues = Object.values(ExpenseCategory);

export const createExpenseValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    category: Yup.mixed<ExpenseCategory>()
      .oneOf(expenseCategoryValues, 'category must be a valid ExpenseCategory')
      .required('category is required'),
    expenseKey: Yup.string().trim().required('expenseKey is required'),
    label: Yup.string().trim().required('label is required'),
    monthlyAmount: Yup.number().min(0, 'monthlyAmount must be non-negative').notRequired(),
  }),
});

export const listExpensesValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});
