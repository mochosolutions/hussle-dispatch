import { RateconImportStatus } from '@prisma/client';
import * as Yup from 'yup';

const statusValues = Object.values(RateconImportStatus);

export const listImportsValidator = Yup.object({
  query: Yup.object({
    status: Yup.mixed<RateconImportStatus>()
      .oneOf(statusValues, 'status must be a valid RateconImportStatus')
      .optional(),
    includeResolved: Yup.string().oneOf(['true', 'false']).optional(),
  }),
});

export const importIdValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const acceptImportValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    loadId: Yup.string().uuid('loadId must be a valid uuid').required('loadId is required'),
  }),
});
