import * as Yup from 'yup';

/**
 * POST /api/v1/agreements
 * Format validation only — business rules (e.g. existing PENDING agreement)
 * live in the requestAgreement service.
 */
export const requestAgreementValidator = Yup.object({
  body: Yup.object({
    carrierId: Yup.string()
      .uuid('carrierId must be a valid uuid')
      .required('carrierId is required'),
    templateKey: Yup.string()
      .oneOf(['DISPATCH_AGREEMENT'], 'templateKey must be DISPATCH_AGREEMENT')
      .required('templateKey is required'),
    signerName: Yup.string().trim().max(255, 'signerName must be at most 255 characters').notRequired(),
    signerEmail: Yup.string()
      .trim()
      .email('signerEmail must be a valid email')
      .max(255, 'signerEmail must be at most 255 characters')
      .notRequired(),
    correlationId: Yup.string().uuid('correlationId must be a valid uuid').notRequired(),
  }),
});
