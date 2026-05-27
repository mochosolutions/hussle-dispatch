import * as Yup from 'yup';

export const dispatchOverrideValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    loadId: Yup.string().uuid('loadId must be a valid uuid').required('loadId is required'),
    reason: Yup.string()
      .trim()
      .required('reason is required')
      .min(1, 'reason must be at least 1 character')
      .max(1000, 'reason must be at most 1000 characters'),
  }),
});
