import * as Yup from 'yup';

/**
 * POST /api/v1/agreements/manual
 * Format validation only — business rules (existing signed/pending agreement,
 * carrier ownership) live in the createManualAgreement service.
 */
export const createManualAgreementValidator = Yup.object({
  body: Yup.object({
    carrierId: Yup.string()
      .uuid('carrierId must be a valid uuid')
      .required('carrierId is required'),
    templateKey: Yup.string()
      .oneOf(['DISPATCH_AGREEMENT'], 'templateKey must be DISPATCH_AGREEMENT')
      .required('templateKey is required'),
    signedPdfS3Key: Yup.string()
      .trim()
      .min(1, 'signedPdfS3Key is required')
      .required('signedPdfS3Key is required'),
    signerName: Yup.string()
      .trim()
      .min(1, 'signerName is required')
      .max(255, 'signerName must be at most 255 characters')
      .required('signerName is required'),
    signerEmail: Yup.string()
      .trim()
      .email('signerEmail must be a valid email')
      .max(255, 'signerEmail must be at most 255 characters')
      .notRequired(),
    signedAt: Yup.date().required('signedAt is required'),
  }),
});
