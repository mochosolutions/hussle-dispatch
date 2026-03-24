import * as Yup from 'yup';

const stateCodeValidator = Yup.string()
  .trim()
  .uppercase()
  .matches(/^[A-Z]{2}$/, 'Must be a 2-letter state code');

const laneSchema = Yup.object({
  originState: stateCodeValidator.required('Origin state is required'),
  destState: stateCodeValidator.required('Destination state is required'),
  originCity: Yup.string().nullable().trim(),
  destCity: Yup.string().nullable().trim(),
});

const noGoZoneSchema = Yup.object({
  state: stateCodeValidator.required('State is required'),
  city: Yup.string().nullable().trim(),
});

export const driverPreferencesSchema = Yup.object({
  preferredLanes: Yup.array().of(laneSchema.required()).defined(),
  noGoZones: Yup.array().of(noGoZoneSchema.required()).defined(),
  maxDaysOut: Yup.number().nullable().min(0).max(30),
}).required();

export type DriverPreferencesFormValues = Yup.InferType<typeof driverPreferencesSchema>;
