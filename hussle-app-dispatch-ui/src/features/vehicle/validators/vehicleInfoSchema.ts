import * as Yup from 'yup';
import type { VehicleType, VehicleOwnership } from 'features/carrier/types';

export const vehicleInfoSchema = Yup.object({
  unitNumber: Yup.string().required('Unit number is required').trim(),
  make: Yup.string().trim().defined().default(''),
  model: Yup.string().trim().defined().default(''),
  // Year accepted as either '' (empty input) or a parsed number; converted before submit.
  year: Yup.mixed<string | number>().defined().default(''),
  vin: Yup.string().trim().defined().default(''),
  licensePlate: Yup.string().trim().defined().default(''),
  licensePlateState: Yup.string().trim().defined().default(''),
  type: Yup.mixed<VehicleType>()
    .required('Vehicle type is required')
    .oneOf(['DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK', 'BOX_TRUCK', 'HOTSHOT', 'POWER_ONLY']),
  ownership: Yup.mixed<VehicleOwnership>()
    .required('Ownership is required')
    .oneOf(['OWNED', 'LEASED']),
  emergencyContactName: Yup.string().trim().defined().default(''),
  emergencyContactPhone: Yup.string().trim().defined().default(''),
  warrantyInfo: Yup.string().trim().defined().default(''),
  notes: Yup.string().trim().defined().default(''),
  monthlyGrossTarget: Yup.mixed<string | number>().defined().default(''),
  monthlyMilesTarget: Yup.mixed<string | number>().defined().default(''),
  workingDaysPerMonth: Yup.mixed<string | number>().defined().default(''),
  carrierId: Yup.string().defined().default(''),
}).required();

export type VehicleInfoFormValues = Yup.InferType<typeof vehicleInfoSchema>;
