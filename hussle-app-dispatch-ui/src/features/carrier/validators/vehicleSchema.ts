import * as Yup from 'yup';

export const vehicleSchema = Yup.object({
  unitNumber: Yup.string().required('Unit number is required'),
  year: Yup.string().required('Year is required'),
  make: Yup.string().required('Make is required'),
  model: Yup.string(),
  vin: Yup.string(),
  type: Yup.string(),
  licensePlate: Yup.string(),
});
