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
  licenseType: Yup.string()
    .oneOf(['CLASS_D', 'CLASS_M', 'CDL_A', 'CDL_B', 'CDL_C'])
    .required('License type is required'),
  licenseNumber: Yup.string().nullable().trim(),
  licenseState: stateCodeValidator.nullable(),
  licenseExpiry: Yup.string().nullable(),
  endorsements: Yup.array()
    .of(Yup.string().oneOf(['H', 'N', 'X', 'T', 'P', 'S']))
    .nullable(),
  homeBaseCity: Yup.string().nullable().trim(),
  homeBaseState: stateCodeValidator.nullable(),
  payType: Yup.string()
    .oneOf(['PERCENTAGE', 'PER_MILE', 'PER_HOUR', 'FLAT_RATE'])
    .required('Pay type is required'),
  payRate: Yup.number()
    .typeError('Pay rate is required')
    .required('Pay rate is required')
    .min(0, 'Pay rate must be 0 or greater'),
  notes: Yup.string().nullable().trim(),
}).required();

export type DriverInfoFormValues = Yup.InferType<typeof driverInfoSchema>;
