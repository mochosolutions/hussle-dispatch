import * as Yup from 'yup';

export const approveCarrierValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const rejectCarrierValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    reason: Yup.string()
      .trim()
      .required('reason is required')
      .max(1000, 'reason must be at most 1000 characters'),
  }),
});
