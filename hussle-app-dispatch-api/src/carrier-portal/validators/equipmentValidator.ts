import * as Yup from 'yup';

const VEHICLE_CATEGORIES = ['SEMI_TRUCK', 'BOX_TRUCK', 'CARGO_VAN', 'PERSONAL_VEHICLE'] as const;

const vehicleSchema = Yup.object({
  id: Yup.string().uuid('Invalid vehicle id').optional(),
  category: Yup.string()
    .oneOf([...VEHICLE_CATEGORIES], 'Invalid vehicle category')
    .required('Vehicle category is required'),
  year: Yup.number().integer().optional(),
  make: Yup.string().required('Make is required').max(100, 'Make must be at most 100 characters'),
  model: Yup.string().required('Model is required').max(100, 'Model must be at most 100 characters'),
  vin: Yup.string().required('VIN is required').max(17, 'VIN must be at most 17 characters'),
  licensePlate: Yup.string()
    .required('License plate is required')
    .max(20, 'License plate must be at most 20 characters'),
  // Federal highway weight limit for combination vehicles is 80,000 lbs; the
  // heaviest legal trucks operate at or below this. Cap matches the UI's
  // form validation (`EquipmentListStep`).
  gvwr: Yup.number()
    .min(0, 'GVWR must be non-negative')
    .max(80000, 'GVWR must be at most 80,000 lbs')
    .optional(),
});

export const equipmentValidator = Yup.object({
  body: Yup.object({
    vehicles: Yup.array()
      .of(vehicleSchema)
      .min(1, 'At least one vehicle is required')
      .max(50, 'Maximum 50 vehicles allowed')
      .required('Vehicles array is required'),
  }),
});
