import * as Yup from 'yup';
import type { InferType } from 'yup';
import type { FacilityType, DockType } from '../types';

export const placeSchema = Yup.object({
  name: Yup.string().required('Name is required').min(2, 'Min 2 characters'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  facilityType: Yup.mixed<FacilityType>()
    .oneOf(
      [
        'WAREHOUSE',
        'DISTRIBUTION_CENTER',
        'MANUFACTURING',
        'COLD_STORAGE',
        'CROSS_DOCK',
        'PORT',
        'RAIL_YARD',
        'DROP_YARD',
        'OTHER',
      ],
      'Invalid facility type',
    )
    .nullable()
    .default(null),
  dockType: Yup.mixed<DockType>()
    .oneOf(['DOCK_HIGH', 'GROUND_LEVEL', 'BOTH', 'NONE'], 'Invalid dock type')
    .nullable()
    .default(null),
  address: Yup.string().default(''),
  address2: Yup.string().default(''),
  zip: Yup.string().default(''),
  contactName: Yup.string().default(''),
  contactPhone: Yup.string().default(''),
  contactEmail: Yup.string().email('Invalid email').default(''),
  operatingHours: Yup.string().default(''),
  receivingHours: Yup.string().default(''),
  appointmentRequired: Yup.boolean().default(false),
  lumperRequired: Yup.boolean().default(false),
  ppeRequired: Yup.boolean().default(false),
  checkInProcedures: Yup.string().default(''),
  notes: Yup.string().default(''),
}).required();

export type PlaceFormValues = InferType<typeof placeSchema>;
