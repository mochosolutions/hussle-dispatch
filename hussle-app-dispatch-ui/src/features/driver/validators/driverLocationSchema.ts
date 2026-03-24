import * as Yup from 'yup';

const stateCodeValidator = Yup.string()
  .trim()
  .uppercase()
  .matches(/^[A-Z]{2}$/, 'Must be a 2-letter state code');

export const driverLocationSchema = Yup.object({
  currentCity: Yup.string().nullable().trim(),
  currentState: stateCodeValidator.nullable(),
  homeBaseCity: Yup.string().nullable().trim(),
  homeBaseState: stateCodeValidator.nullable(),
  availableHours: Yup.string().nullable().trim(),
  maxDaysOut: Yup.number().nullable().min(0).max(30),
}).required();

export type DriverLocationFormValues = Yup.InferType<typeof driverLocationSchema>;
