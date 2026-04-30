import { ExpenseCategory, ExpenseSource, FuelType } from '@prisma/client';
import * as Yup from 'yup';

const expenseCategoryValues = Object.values(ExpenseCategory);
const expenseSourceValues = Object.values(ExpenseSource);
const fuelTypeValues = Object.values(FuelType);

const optionalTrimmed = Yup.string().trim().notRequired();

const createBodySchema = Yup.object({
  vehicleId: Yup.string().uuid('vehicleId must be a valid uuid').required('vehicleId is required'),
  driverId: Yup.string().uuid('driverId must be a valid uuid').notRequired(),
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

const updateBodySchema = createBodySchema
  .shape({
    vehicleId: Yup.string().uuid('vehicleId must be a valid uuid').notRequired(),
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

export const createExpenseValidator = Yup.object({
  body: createBodySchema,
});

export const updateExpenseValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: updateBodySchema,
});

export const listExpensesValidator = Yup.object({
  query: Yup.object({
    vehicleId: Yup.string().uuid('vehicleId must be a valid uuid').notRequired(),
    driverId: Yup.string().uuid('driverId must be a valid uuid').notRequired(),
    dateFrom: Yup.date().notRequired(),
    dateTo: Yup.date().notRequired(),
    category: Yup.mixed<ExpenseCategory>()
      .oneOf(expenseCategoryValues, 'category must be a valid ExpenseCategory')
      .notRequired(),
    hasReceipt: Yup.boolean().notRequired(),
    source: Yup.mixed<ExpenseSource>()
      .oneOf(expenseSourceValues, 'source must be a valid ExpenseSource')
      .notRequired(),
    page: Yup.number().integer().min(1).notRequired().default(1),
    limit: Yup.number().integer().min(1).max(100).notRequired().default(25),
    sort: Yup.string().oneOf(['date', 'amount', 'category']).notRequired().default('date'),
    order: Yup.string().oneOf(['asc', 'desc']).notRequired().default('desc'),
  }),
});

export const getExpenseValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const deleteExpenseValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const presignReceiptValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    fileName: Yup.string().trim().required('fileName is required'),
    mimeType: Yup.string()
      .oneOf(
        ['application/pdf', 'image/png', 'image/jpg', 'image/jpeg'],
        'mimeType must be one of: application/pdf, image/png, image/jpg, image/jpeg',
      )
      .required('mimeType is required'),
  }),
});

export const confirmReceiptValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});
