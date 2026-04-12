import * as Yup from 'yup';

const VEHICLE_CATEGORIES = ['SEMI_TRUCK', 'BOX_TRUCK', 'CARGO_VAN', 'PERSONAL_VEHICLE'] as const;

const vehicleSchema = Yup.object({
  category: Yup.string()
    .oneOf([...VEHICLE_CATEGORIES], 'Invalid vehicle category')
    .required('Vehicle category is required'),
  year: Yup.number().integer().optional(),
  make: Yup.string().max(100, 'Make must be at most 100 characters').optional(),
  model: Yup.string().max(100, 'Model must be at most 100 characters').optional(),
  vin: Yup.string().max(17, 'VIN must be at most 17 characters').optional(),
  licensePlate: Yup.string().max(20, 'License plate must be at most 20 characters').optional(),
  gvwr: Yup.number().min(0, 'GVWR must be non-negative').optional(),
  lenderName: Yup.string().optional(),
  loanPayment: Yup.number().min(0, 'Loan payment must be non-negative').optional(),
  loanInterestRate: Yup.number()
    .min(0, 'Interest rate must be non-negative')
    .max(100, 'Interest rate must be at most 100')
    .optional(),
  insuranceMonthlyCost: Yup.number()
    .min(0, 'Insurance cost must be non-negative')
    .optional(),
  deliveryTypes: Yup.array().of(Yup.string().required()).optional(),
  insuranceAttested: Yup.boolean().optional(),
});

export const equipmentValidator = Yup.object({
  body: Yup.object({
    vehicles: Yup.array()
      .of(vehicleSchema)
      .min(1, 'At least one vehicle is required')
      .max(50, 'Maximum 50 vehicles allowed')
      .required('Vehicles array is required'),
    medicalCourierCompliance: Yup.object().optional(),
  }),
});
