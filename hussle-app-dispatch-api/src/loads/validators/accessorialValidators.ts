import { AccessorialType } from '@prisma/client';
import * as Yup from 'yup';

const accessorialTypeValues = Object.values(AccessorialType);

const createAccessorialBodySchema = Yup.object({
  type: Yup.mixed<AccessorialType>()
    .oneOf(accessorialTypeValues, 'type must be a valid AccessorialType')
    .required('type is required'),
  amount: Yup.number()
    .positive('amount must be positive')
    .required('amount is required'),
  description: Yup.string().trim().max(500, 'description must be at most 500 characters')
    .notRequired(),
  billTo: Yup.string().trim().max(100, 'billTo must be at most 100 characters').notRequired(),
  notes: Yup.string().trim().max(2000, 'notes must be at most 2000 characters').notRequired(),
});

const updateAccessorialBodySchema = Yup.object({
  type: Yup.mixed<AccessorialType>()
    .oneOf(accessorialTypeValues, 'type must be a valid AccessorialType')
    .notRequired(),
  amount: Yup.number().positive('amount must be positive').notRequired(),
  description: Yup.string().trim().max(500, 'description must be at most 500 characters')
    .notRequired(),
  billTo: Yup.string().trim().max(100, 'billTo must be at most 100 characters').notRequired(),
  notes: Yup.string().trim().max(2000, 'notes must be at most 2000 characters').notRequired(),
}).test('has-any-field', 'At least one field must be provided', (value) => {
  if (value === undefined) {
    return false;
  }
  return Object.keys(value).length > 0;
});

export const createAccessorialSchema = Yup.object({
  params: Yup.object({
    loadId: Yup.string().uuid('loadId must be a valid uuid').required('loadId is required'),
  }),
  body: createAccessorialBodySchema,
});

export const updateAccessorialSchema = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: updateAccessorialBodySchema,
});

export const deleteAccessorialSchema = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const listAccessorialsSchema = Yup.object({
  params: Yup.object({
    loadId: Yup.string().uuid('loadId must be a valid uuid').required('loadId is required'),
  }),
});
