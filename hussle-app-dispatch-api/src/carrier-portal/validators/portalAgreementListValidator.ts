import * as Yup from 'yup';

/**
 * GET /api/v1/carrier-portal/agreements
 * carrierId is derived from the invite-token context (req.carrierPortal.carrierId),
 * not query. Only templateKey is accepted from the client and is required.
 */
export const portalAgreementListValidator = Yup.object({
  query: Yup.object({
    templateKey: Yup.string()
      .oneOf(['DISPATCH_AGREEMENT'], 'templateKey must be DISPATCH_AGREEMENT')
      .required('templateKey is required'),
  }),
});
