import * as Yup from 'yup';

const stateCodeValidator = Yup.string()
  .trim()
  .uppercase()
  .matches(/^[A-Z]{2}$/, 'Must be a 2-letter state code');

const laneSchema = Yup.object({
  originState: stateCodeValidator.required('Origin state is required'),
  destState: stateCodeValidator.required('Destination state is required'),
  originCity: Yup.string().trim().defined().default(''),
  destCity: Yup.string().trim().defined().default(''),
}).required();

const noGoZoneSchema = Yup.object({
  state: stateCodeValidator.required('State is required'),
  city: Yup.string().trim().defined().default(''),
}).required();

export const driverPreferencesSchema = Yup.object({
  preferredLanes: Yup.array().of(laneSchema).defined().default([]),
  noGoZones: Yup.array().of(noGoZoneSchema).defined().default([]),
  maxDaysOut: Yup.number().nullable().defined().min(0).max(30),
}).required();

export type DriverPreferencesFormValues = Yup.InferType<typeof driverPreferencesSchema>;
export type PreferredLaneFormValues = Yup.InferType<typeof laneSchema>;
export type NoGoZoneFormValues = Yup.InferType<typeof noGoZoneSchema>;
