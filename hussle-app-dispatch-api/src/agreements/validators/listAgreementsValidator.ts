import * as Yup from 'yup';

const AGREEMENT_STATUS_VALUES = ['DRAFT', 'PENDING', 'SIGNED', 'VOIDED', 'EXPIRED', 'DECLINED'] as const;

/**
 * GET /api/v1/agreements
 * Pagination and filter validation. Defaults: page=1, limit=20.
 */
export const listAgreementsValidator = Yup.object({
  query: Yup.object({
    carrierId: Yup.string().uuid('carrierId must be a valid uuid').notRequired(),
    status: Yup.string()
      .oneOf([...AGREEMENT_STATUS_VALUES], 'status must be a valid AgreementStatus')
      .notRequired(),
    templateKey: Yup.string()
      .oneOf(['DISPATCH_AGREEMENT'], 'templateKey must be DISPATCH_AGREEMENT')
      .notRequired(),
    createdAfter: Yup.date().notRequired(),
    createdBefore: Yup.date().notRequired(),
    page: Yup.number().integer().min(1).notRequired(),
    limit: Yup.number().integer().min(1).max(100).notRequired(),
  }),
});
