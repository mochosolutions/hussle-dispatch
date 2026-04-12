import * as Yup from 'yup';

export const costAnalysisValidator = Yup.object({
  body: Yup.object({
    truckPayment: Yup.number().required('truckPayment is required').min(0, 'truckPayment must be >= 0'),
    insuranceCost: Yup.number()
      .required('insuranceCost is required')
      .min(0, 'insuranceCost must be >= 0'),
    fuelCostPerGallon: Yup.number()
      .required('fuelCostPerGallon is required')
      .min(0, 'fuelCostPerGallon must be >= 0')
      .max(20, 'fuelCostPerGallon must be <= 20'),
    milesPerGallon: Yup.number()
      .required('milesPerGallon is required')
      .min(1, 'milesPerGallon must be >= 1')
      .max(30, 'milesPerGallon must be <= 30'),
    maintenanceMonthlyCost: Yup.number()
      .required('maintenanceMonthlyCost is required')
      .min(0, 'maintenanceMonthlyCost must be >= 0'),
    otherMonthlyCosts: Yup.number()
      .required('otherMonthlyCosts is required')
      .min(0, 'otherMonthlyCosts must be >= 0'),
  }),
});
