import * as Yup from 'yup';
import type { DriverLicenseType, DriverPayType, EndorsementCode } from 'features/carrier/types';

const stateCodeValidator = Yup.string()
  .trim()
  .uppercase()
  .matches(/^[A-Z]{2}$/, 'Must be a 2-letter state code')
  .defined()
  .default('');

export const driverInfoSchema = Yup.object({
  carrierId: Yup.string().nullable().defined(),
  firstName: Yup.string().required('First name is required').trim(),
  lastName: Yup.string().required('Last name is required').trim(),
  phone: Yup.string().trim().defined().default(''),
  email: Yup.string().email('Invalid email').trim().defined().default(''),
  licenseType: Yup.mixed<DriverLicenseType>()
    .oneOf(['CLASS_D', 'CLASS_M', 'CDL_A', 'CDL_B', 'CDL_C'])
    .required('License type is required'),
  licenseNumber: Yup.string().trim().defined().default(''),
  licenseState: stateCodeValidator,
  licenseExpiry: Yup.string().defined().default(''),
  endorsements: Yup.array()
    .of(Yup.mixed<EndorsementCode>().oneOf(['H', 'N', 'X', 'T', 'P', 'S']).required())
    .defined()
    .default([]),
  homeBaseCity: Yup.string().trim().defined().default(''),
  homeBaseState: stateCodeValidator,
  payType: Yup.mixed<DriverPayType>()
    .oneOf(['PERCENTAGE', 'PER_MILE', 'PER_HOUR', 'FLAT_RATE'])
    .required('Pay type is required'),
  payRate: Yup.number()
    .typeError('Pay rate is required')
    .required('Pay rate is required')
    .min(0, 'Pay rate must be 0 or greater'),
  notes: Yup.string().trim().defined().default(''),
}).required();

export type DriverInfoFormValues = Yup.InferType<typeof driverInfoSchema>;
