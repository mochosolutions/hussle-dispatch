import * as Yup from 'yup';

const ALLOWED_TEMPLATE_KEYS = ['DISPATCH_AGREEMENT'] as const;

/**
 * GET /api/v1/carrier-portal/agreements
 * carrierId is derived from the invite-token context (req.carrierPortal.carrierId),
 * not query. Only templateKeys is accepted from the client.
 *
 * Shape: `templateKeys=DISPATCH_AGREEMENT` or `templateKeys=DISPATCH_AGREEMENT,W9`
 * (CSV). Each token must be in ALLOWED_TEMPLATE_KEYS — unknown tokens fail
 * validation with 400.
 */
export const portalAgreementListValidator = Yup.object({
  query: Yup.object({
    templateKeys: Yup.string()
      .required('templateKeys is required')
      .test(
        'csv-of-known-keys',
        'templateKeys must be a CSV of known agreement keys',
        (value): boolean => {
          if (typeof value !== 'string' || value.length === 0) {
            return false;
          }
          const tokens = value
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
          if (tokens.length === 0) {
            return false;
          }
          return tokens.every((t) => (ALLOWED_TEMPLATE_KEYS as readonly string[]).includes(t));
        },
      ),
  }),
});
