import * as Yup from 'yup';

export const driverInfoSchema = Yup.object({
  name: Yup.string().required('Name is required').trim(),
  phone: Yup.string().nullable().trim(),
  email: Yup.string().nullable().email('Invalid email').trim(),
  cdlNumber: Yup.string().nullable().trim(),
  cdlState: Yup.string().nullable().trim(),
  cdlExpiry: Yup.string().nullable(),
  notes: Yup.string().nullable().trim(),
}).required();

export type DriverInfoFormValues = Yup.InferType<typeof driverInfoSchema>;
