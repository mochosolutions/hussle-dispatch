import { CustomerStatus, CustomerType } from '@prisma/client';
import * as Yup from 'yup';

const customerTypeValues = Object.values(CustomerType);
const customerStatusValues = Object.values(CustomerStatus);

const optionalTrimmed = Yup.string().trim().notRequired();

const createBodySchema = Yup.object({
  type: Yup.mixed<CustomerType>()
    .oneOf(customerTypeValues, 'type must be a valid CustomerType')
    .required('type is required'),
  companyName: Yup.string()
    .trim()
    .max(255, 'companyName must be at most 255 characters')
    .required('companyName is required'),
  mcNumber: optionalTrimmed,
  dotNumber: optionalTrimmed,
  phone: optionalTrimmed,
  email: Yup.string().trim().email('email must be valid').notRequired(),
  website: Yup.string().trim().url('website must be a valid URL').notRequired(),
  address: optionalTrimmed,
  city: optionalTrimmed,
  state: optionalTrimmed,
  zip: optionalTrimmed,
  paymentTerms: optionalTrimmed,
  paymentTermsDays: Yup.number()
    .integer('paymentTermsDays must be an integer')
    .positive('paymentTermsDays must be positive')
    .default(30)
    .notRequired(),
  quickPayDiscount: Yup.number()
    .min(0, 'quickPayDiscount must be at least 0')
    .max(100, 'quickPayDiscount must be at most 100')
    .notRequired(),
  notes: optionalTrimmed,
  status: Yup.mixed<CustomerStatus>()
    .oneOf(customerStatusValues, 'status must be a valid CustomerStatus')
    .default(CustomerStatus.ACTIVE)
    .notRequired(),
});

const updateBodySchema = createBodySchema
  .shape({
    type: Yup.mixed<CustomerType>()
      .oneOf(customerTypeValues, 'type must be a valid CustomerType')
      .notRequired(),
    companyName: Yup.string()
      .trim()
      .max(255, 'companyName must be at most 255 characters')
      .notRequired(),
  })
  .test('has-any-field', 'At least one field must be provided', (value) => {
    if (value === undefined) {
      return false;
    }
    return Object.keys(value).length > 0;
  });

export const createCustomerSchema = Yup.object({
  body: createBodySchema,
});

export const updateCustomerSchema = Yup.object({
  body: updateBodySchema,
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const customerIdParamSchema = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const listCustomersQuerySchema = Yup.object({
  query: Yup.object({
    page: Yup.number().integer().min(1).notRequired(),
    limit: Yup.number().integer().min(1).max(100).notRequired(),
    search: Yup.string().trim().notRequired(),
    type: Yup.mixed<CustomerType>().oneOf(customerTypeValues).notRequired(),
    status: Yup.mixed<CustomerStatus>().oneOf(customerStatusValues).notRequired(),
    sortBy: Yup.string().trim().notRequired(),
    sortOrder: Yup.string().oneOf(['asc', 'desc']).notRequired(),
  }),
});
