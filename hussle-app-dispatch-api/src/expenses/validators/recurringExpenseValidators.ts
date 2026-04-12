import { ExpenseCategory, Frequency } from '@prisma/client';
import * as Yup from 'yup';

const expenseCategoryValues = Object.values(ExpenseCategory);
const frequencyValues = Object.values(Frequency);

const createBodySchema = Yup.object({
  vehicleId: Yup.string().uuid('vehicleId must be a valid uuid').required('vehicleId is required'),
  category: Yup.mixed<ExpenseCategory>()
    .oneOf(expenseCategoryValues, 'category must be a valid ExpenseCategory')
    .required('category is required'),
  label: Yup.string().trim().required('label is required').min(1).max(100),
  amount: Yup.number().positive('amount must be positive').required('amount is required'),
  frequency: Yup.mixed<Frequency>()
    .oneOf(frequencyValues, 'frequency must be a valid Frequency')
    .optional()
    .default('MONTHLY' as Frequency),
  dayOfMonth: Yup.number()
    .integer('dayOfMonth must be an integer')
    .min(1, 'dayOfMonth must be at least 1')
    .max(28, 'dayOfMonth must be at most 28')
    .notRequired(),
});

const updateBodySchema = createBodySchema
  .shape({
    vehicleId: Yup.string().uuid('vehicleId must be a valid uuid').notRequired(),
    category: Yup.mixed<ExpenseCategory>()
      .oneOf(expenseCategoryValues, 'category must be a valid ExpenseCategory')
      .notRequired(),
    label: Yup.string().trim().min(1).max(100).notRequired(),
    amount: Yup.number().positive('amount must be positive').notRequired(),
    frequency: Yup.mixed<Frequency>()
      .oneOf(frequencyValues, 'frequency must be a valid Frequency')
      .notRequired(),
  })
  .test('has-any-field', 'At least one field must be provided', (value) => {
    if (value === undefined) {
      return false;
    }
    return Object.keys(value).length > 0;
  });

export const createRecurringExpenseValidator = Yup.object({
  body: createBodySchema,
});

export const updateRecurringExpenseValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: updateBodySchema,
});

export const listRecurringExpensesValidator = Yup.object({
  query: Yup.object({
    vehicleId: Yup.string()
      .uuid('vehicleId must be a valid uuid')
      .required('vehicleId is required'),
  }),
});

export const generateRecurringValidator = Yup.object({
  body: Yup.object({
    vehicleId: Yup.string()
      .uuid('vehicleId must be a valid uuid')
      .required('vehicleId is required'),
  }),
});

export const recurringExpenseIdValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});
