import * as Yup from 'yup';

/**
 * Validator for routes that take :id as a path param (GET /:id).
 */
export const agreementIdParamValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

/**
 * Validator for POST /:id/void — :id param plus an optional `reason` body field.
 */
export const voidAgreementValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    reason: Yup.string().trim().max(500, 'reason must be at most 500 characters').notRequired(),
  }),
});
