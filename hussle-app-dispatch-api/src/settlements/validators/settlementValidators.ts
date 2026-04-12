import { SettlementStatus } from '@prisma/client';
import * as Yup from 'yup';

const settlementStatusValues = Object.values(SettlementStatus);

const optionalUuid = Yup.string()
  .trim()
  .transform((_value, originalValue) => {
    if (originalValue === '') {
      return null;
    }
    return originalValue;
  })
  .nullable()
  .uuid()
  .notRequired();

export const generateSettlementValidator = Yup.object({
  body: Yup.object({
    carrierId: Yup.string().uuid('carrierId must be a valid uuid').required('carrierId is required'),
    driverId: optionalUuid,
    vehicleId: optionalUuid,
    periodStart: Yup.date().required('periodStart is required'),
    periodEnd: Yup.date().required('periodEnd is required'),
  }),
});

export const listSettlementsValidator = Yup.object({
  query: Yup.object({
    status: Yup.mixed<SettlementStatus>()
      .oneOf(settlementStatusValues, 'status must be a valid SettlementStatus')
      .notRequired(),
    carrierId: Yup.string().uuid().notRequired(),
    driverId: Yup.string().uuid().notRequired(),
    periodStart: Yup.date().notRequired(),
    periodEnd: Yup.date().notRequired(),
    skip: Yup.number().integer().min(0).default(0),
    take: Yup.number().integer().min(1).max(100).default(25),
  }),
});

export const settlementIdValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const approveSettlementValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const paySettlementValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    paymentMethod: Yup.string().trim().required('paymentMethod is required'),
    paymentReference: Yup.string().trim().notRequired(),
  }),
});

export const disputeSettlementValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    disputeReason: Yup.string()
      .trim()
      .min(1, 'disputeReason must not be empty')
      .required('disputeReason is required'),
  }),
});

export const createAdjustmentValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    description: Yup.string().trim().required('description is required'),
    amount: Yup.number().required('amount is required'),
    date: Yup.date().required('date is required'),
  }),
});

export const updateAdjustmentValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
    lineItemId: Yup.string()
      .uuid('lineItemId must be a valid uuid')
      .required('lineItemId is required'),
  }),
  body: Yup.object({
    description: Yup.string().trim().notRequired(),
    amount: Yup.number().notRequired(),
    date: Yup.date().notRequired(),
  }),
});

export const deleteAdjustmentValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
    lineItemId: Yup.string()
      .uuid('lineItemId must be a valid uuid')
      .required('lineItemId is required'),
  }),
});

export const sendSettlementValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});
