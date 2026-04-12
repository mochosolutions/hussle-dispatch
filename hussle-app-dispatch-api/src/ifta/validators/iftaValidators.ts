import * as Yup from 'yup';

export const putStateMilesValidator = Yup.object({
  params: Yup.object({
    loadId: Yup.string().uuid('loadId must be a valid uuid').required('loadId is required'),
  }),
  body: Yup.object({
    stateMiles: Yup.array()
      .of(
        Yup.object({
          state: Yup.string()
            .length(2, 'state must be exactly 2 characters')
            .uppercase()
            .required('state is required'),
          miles: Yup.number().positive('miles must be positive').required('miles is required'),
        }).required(),
      )
      .min(1, 'stateMiles must have at least 1 entry')
      .required('stateMiles is required'),
  }),
});

export const getStateMilesValidator = Yup.object({
  params: Yup.object({
    loadId: Yup.string().uuid('loadId must be a valid uuid').required('loadId is required'),
  }),
});

export const iftaReportValidator = Yup.object({
  query: Yup.object({
    year: Yup.number().integer().min(2020).max(2099).required(),
    quarter: Yup.number().integer().min(1).max(4).required(),
    vehicleId: Yup.string().uuid().optional(),
  }),
});
