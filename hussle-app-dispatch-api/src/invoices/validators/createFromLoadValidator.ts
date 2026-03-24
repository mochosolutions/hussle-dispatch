import * as Yup from 'yup';

export const createFromLoadValidator = Yup.object({
  params: Yup.object({
    loadId: Yup.string().uuid('loadId must be a valid uuid').required('loadId is required'),
  }),
});

export const voidInvoiceValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});
