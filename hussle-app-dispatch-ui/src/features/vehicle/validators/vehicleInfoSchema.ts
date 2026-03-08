import * as Yup from 'yup';

export const vehicleInfoSchema = Yup.object({
  unitNumber: Yup.string().required('Unit number is required').trim(),
  make: Yup.string().nullable().trim(),
  model: Yup.string().nullable().trim(),
  year: Yup.number().nullable().min(1900, 'Invalid year').max(2100, 'Invalid year'),
  vin: Yup.string().nullable().trim(),
  licensePlate: Yup.string().nullable().trim(),
  licensePlateState: Yup.string().nullable().trim(),
  type: Yup.string()
    .required('Vehicle type is required')
    .oneOf(['DRY_VAN', 'REEFER', 'FLATBED', 'STEP_DECK', 'BOX_TRUCK', 'HOTSHOT', 'POWER_ONLY']),
  ownership: Yup.string().required('Ownership is required').oneOf(['OWNED', 'LEASED']),
  emergencyContactName: Yup.string().nullable().trim(),
  emergencyContactPhone: Yup.string().nullable().trim(),
  warrantyInfo: Yup.string().nullable().trim(),
  notes: Yup.string().nullable().trim(),
}).required();

export type VehicleInfoFormValues = Yup.InferType<typeof vehicleInfoSchema>;
