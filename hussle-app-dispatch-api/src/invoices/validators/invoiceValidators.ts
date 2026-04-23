import { InvoiceStatus, InvoiceType } from '@prisma/client';
import * as Yup from 'yup';

const invoiceStatusValues = Object.values(InvoiceStatus);
const invoiceTypeValues = Object.values(InvoiceType);

export const listInvoicesValidator = Yup.object({
  query: Yup.object({
    status: Yup.string().trim().notRequired(),
    type: Yup.mixed<InvoiceType>().oneOf(invoiceTypeValues).notRequired(),
    overdue: Yup.string().oneOf(['true', 'false']).notRequired(),
    missingBol: Yup.string().oneOf(['true', 'false']).notRequired(),
  }),
});

export const invoiceIdParamValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const updateInvoiceValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    subtotal: Yup.number().min(0).notRequired(),
    accessorials: Yup.number().min(0).notRequired(),
    totalAmount: Yup.number().min(0).notRequired(),
    paymentTerms: Yup.string().trim().notRequired(),
    paymentTermsDays: Yup.number().integer().min(0).notRequired(),
    dueDate: Yup.date().notRequired(),
    notes: Yup.string().trim().notRequired(),
  }),
});

export const sendInvoiceValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    email: Yup.string().email('email must be valid').required('email is required'),
    ccEmails: Yup.array()
      .of(Yup.string().email('ccEmails entries must be valid email addresses').required())
      .notRequired(),
  }),
});

export const markPaidValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    amount: Yup.number().positive('amount must be positive').required('amount is required'),
    method: Yup.string().trim().required('method is required'),
    reference: Yup.string().trim().required('reference is required'),
    date: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}/, 'date must be in YYYY-MM-DD format')
      .required('date is required'),
  }),
});
