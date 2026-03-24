import * as Yup from 'yup';

const stateCodeValidator = Yup.string()
  .trim()
  .uppercase()
  .matches(/^[A-Z]{2}$/, 'Must be a 2-letter state code');

export const driverInfoSchema = Yup.object({
  carrierId: Yup.string().nullable(),
  firstName: Yup.string().required('First name is required').trim(),
  lastName: Yup.string().required('Last name is required').trim(),
  phone: Yup.string().nullable().trim(),
  email: Yup.string().nullable().email('Invalid email').trim(),
  cdlNumber: Yup.string().nullable().trim(),
  cdlState: stateCodeValidator.nullable(),
  cdlExpiry: Yup.string().nullable(),
  homeBaseCity: Yup.string().nullable().trim(),
  homeBaseState: stateCodeValidator.nullable(),
  notes: Yup.string().nullable().trim(),
}).required();

export type DriverInfoFormValues = Yup.InferType<typeof driverInfoSchema>;
