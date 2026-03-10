import * as yup from 'yup';

export const backhaulQueryValidator = yup.object({
  query: yup.object({
    fromCity: yup.string().required('fromCity is required').trim().min(1),
    fromState: yup
      .string()
      .required('fromState is required')
      .trim()
      .length(2, 'fromState must be a 2-letter abbreviation'),
    radius: yup
      .number()
      .required('radius is required')
      .positive('radius must be positive')
      .integer()
      .max(500, 'radius cannot exceed 500 miles'),
    earliestPickup: yup
      .string()
      .required('earliestPickup is required')
      .matches(/^\d{4}-\d{2}-\d{2}/, 'earliestPickup must be in YYYY-MM-DD format'),
  }),
});

export const chainQueryValidator = yup.object({
  params: yup.object({
    id: yup.string().required('id is required'),
  }),
  query: yup.object({
    vehicleId: yup.string().uuid('vehicleId must be a valid uuid').required('vehicleId is required'),
    limit: yup.number().integer().min(1).max(10).notRequired(),
  }),
});
