import * as yup from 'yup';

export const storeMarketDataValidator = yup.object({
  body: yup.object({
    state: yup
      .string()
      .required('State is required')
      .trim()
      .length(2, 'State must be a 2-letter abbreviation'),
    city: yup
      .string()
      .required('City is required')
      .trim()
      .min(1, 'City is required'),
    loadToTruckRatio: yup
      .number()
      .required('loadToTruckRatio is required')
      .min(0, 'loadToTruckRatio must be non-negative'),
  }),
});

export const getMarketDataValidator = yup.object({
  params: yup.object({
    state: yup
      .string()
      .required('State is required')
      .trim()
      .length(2, 'State must be a 2-letter abbreviation'),
    city: yup
      .string()
      .required('City is required')
      .trim()
      .min(1, 'City is required'),
  }),
});
