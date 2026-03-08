import * as Yup from 'yup';

const laneSchema = Yup.object({
  originState: Yup.string().required('Origin state is required').trim(),
  destState: Yup.string().required('Destination state is required').trim(),
  originCity: Yup.string().nullable().trim(),
  destCity: Yup.string().nullable().trim(),
});

const noGoZoneSchema = Yup.object({
  state: Yup.string().required('State is required').trim(),
  city: Yup.string().nullable().trim(),
});

export const driverPreferencesSchema = Yup.object({
  preferredLanes: Yup.array().of(laneSchema.required()).defined(),
  noGoZones: Yup.array().of(noGoZoneSchema.required()).defined(),
  maxDaysOut: Yup.number().nullable().min(0).max(30),
}).required();

export type DriverPreferencesFormValues = Yup.InferType<typeof driverPreferencesSchema>;
