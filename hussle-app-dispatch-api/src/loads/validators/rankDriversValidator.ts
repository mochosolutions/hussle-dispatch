import * as Yup from 'yup';

export const rankDriversValidator = Yup.object({
  params: Yup.object({
    loadId: Yup.string().uuid('loadId must be a valid uuid').required('loadId is required'),
  }),
});
