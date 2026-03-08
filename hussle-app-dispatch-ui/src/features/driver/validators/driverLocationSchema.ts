import * as Yup from 'yup';

export const driverLocationSchema = Yup.object({
  currentCity: Yup.string().nullable().trim(),
  currentState: Yup.string().nullable().trim(),
  homeBaseCity: Yup.string().nullable().trim(),
  homeBaseState: Yup.string().nullable().trim(),
  availableHours: Yup.string().nullable().trim(),
  maxDaysOut: Yup.number().nullable().min(0).max(30),
}).required();

export type DriverLocationFormValues = Yup.InferType<typeof driverLocationSchema>;
