import * as Yup from 'yup';

export const addressSearchValidator = Yup.object({
  query: Yup.object({
    query: Yup.string().trim().required('query is required').min(1),
    limit: Yup.number().integer().min(1).max(20).notRequired(),
  }),
});
