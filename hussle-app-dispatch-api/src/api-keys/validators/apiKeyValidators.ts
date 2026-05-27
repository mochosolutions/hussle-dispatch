import * as yup from 'yup';

export const createApiKeyValidator = yup.object({
  body: yup.object({
    name: yup.string().required('Name is required').min(1).max(128),
  }),
});

export const revokeApiKeyValidator = yup.object({
  params: yup.object({
    id: yup.string().uuid('Id must be a valid UUID').required('Id is required'),
  }),
});
