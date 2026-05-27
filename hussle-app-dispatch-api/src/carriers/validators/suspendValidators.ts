import * as Yup from 'yup';

export const suspendCarrierValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    reason: Yup.string()
      .trim()
      .required('reason is required')
      .min(10, 'reason must be at least 10 characters')
      .max(1000, 'reason must be at most 1000 characters'),
  }),
});

export const unsuspendCarrierValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const adminActivateCarrierValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    reason: Yup.string()
      .trim()
      .required('reason is required')
      .min(10, 'reason must be at least 10 characters')
      .max(1000, 'reason must be at most 1000 characters'),
    evidenceDocumentId: Yup.string()
      .uuid('evidenceDocumentId must be a valid uuid')
      .optional(),
  }),
});
