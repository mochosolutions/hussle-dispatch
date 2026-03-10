import * as Yup from 'yup';

export const driverInfoSchema = Yup.object({
  firstName: Yup.string().required('First name is required').trim(),
  lastName: Yup.string().required('Last name is required').trim(),
  phone: Yup.string().nullable().trim(),
  email: Yup.string().nullable().email('Invalid email').trim(),
  cdlNumber: Yup.string().nullable().trim(),
  cdlState: Yup.string().nullable().trim(),
  cdlExpiry: Yup.string().nullable(),
  homeBaseCity: Yup.string().nullable().trim(),
  homeBaseState: Yup.string().nullable().trim(),
  notes: Yup.string().nullable().trim(),
}).required();

export type DriverInfoFormValues = Yup.InferType<typeof driverInfoSchema>;
