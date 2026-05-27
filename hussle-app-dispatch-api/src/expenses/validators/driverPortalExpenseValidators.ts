import { ExpenseCategory, FuelType } from '@prisma/client';
import * as Yup from 'yup';

const expenseCategoryValues = Object.values(ExpenseCategory);
const fuelTypeValues = Object.values(FuelType);

const optionalTrimmed = Yup.string().trim().notRequired();

const driverPortalCreateBodySchema = Yup.object({
  category: Yup.mixed<ExpenseCategory>()
    .oneOf(expenseCategoryValues, 'category must be a valid ExpenseCategory')
    .required('category is required'),
  vendor: optionalTrimmed,
  amount: Yup.number().positive('amount must be positive').notRequired(),
  date: Yup.date().required('date is required'),
  state: optionalTrimmed,
  notes: optionalTrimmed,
  gallons: Yup.number().positive('gallons must be positive').notRequired(),
  pricePerGallon: Yup.number().positive('pricePerGallon must be positive').notRequired(),
  fuelType: Yup.mixed<FuelType>()
    .oneOf(fuelTypeValues, 'fuelType must be a valid FuelType')
    .notRequired(),
  odometer: Yup.number()
    .integer('odometer must be an integer')
    .positive('odometer must be positive')
    .notRequired(),
});

const driverPortalUpdateBodySchema = driverPortalCreateBodySchema
  .shape({
    category: Yup.mixed<ExpenseCategory>()
      .oneOf(expenseCategoryValues, 'category must be a valid ExpenseCategory')
      .notRequired(),
    date: Yup.date().notRequired(),
  })
  .test('has-any-field', 'At least one field must be provided', (value) => {
    if (value === undefined) {
      return false;
    }
    return Object.keys(value).length > 0;
  });

export const driverPortalCreateExpenseValidator = Yup.object({
  body: driverPortalCreateBodySchema,
});

export const driverPortalUpdateExpenseValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: driverPortalUpdateBodySchema,
});

export const driverPortalListExpensesValidator = Yup.object({
  query: Yup.object({
    dateFrom: Yup.date().notRequired(),
    dateTo: Yup.date().notRequired(),
    category: Yup.mixed<ExpenseCategory>()
      .oneOf(expenseCategoryValues, 'category must be a valid ExpenseCategory')
      .notRequired(),
    page: Yup.number().integer().min(1).notRequired().default(1),
    limit: Yup.number().integer().min(1).max(100).notRequired().default(25),
    sort: Yup.string().oneOf(['date', 'amount', 'category']).notRequired().default('date'),
    order: Yup.string().oneOf(['asc', 'desc']).notRequired().default('desc'),
  }),
});
