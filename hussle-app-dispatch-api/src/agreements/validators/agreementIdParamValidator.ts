import * as Yup from 'yup';

/**
 * Validator for any route that takes :id as a path param. Also accepts an
 * optional `reason` body field used by POST /:id/void.
 */
export const agreementIdParamValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    reason: Yup.string().trim().max(500, 'reason must be at most 500 characters').notRequired(),
  }).notRequired(),
});
