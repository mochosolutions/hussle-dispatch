import * as Yup from 'yup';
import type { InferType } from 'yup';

export const manualEntrySchema = Yup.object({
  originCity: Yup.string().required('Origin city is required').trim(),
  originState: Yup.string().required('Origin state is required').trim().length(2, 'Use 2-letter state code'),
  destinationCity: Yup.string().required('Destination city is required').trim(),
  destinationState: Yup.string().required('Destination state is required').trim().length(2, 'Use 2-letter state code'),
  pickupDate: Yup.string().required('Pickup date is required'),
  equipmentType: Yup.string()
    .required('Equipment type is required')
    .oneOf(['DV', 'RF', 'FB', 'SD'], 'Invalid equipment type'),
  rate: Yup.number().nullable().positive('Rate must be positive'),
  loadedMiles: Yup.number().nullable().positive('Miles must be positive'),
  brokerName: Yup.string().nullable().trim(),
}).required();

export type ManualEntryFormValues = InferType<typeof manualEntrySchema>;
