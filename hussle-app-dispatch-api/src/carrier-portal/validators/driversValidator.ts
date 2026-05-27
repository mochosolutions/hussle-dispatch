import * as Yup from 'yup';

const PAY_TYPES = ['PERCENTAGE', 'PER_MILE', 'PER_HOUR', 'FLAT_RATE'] as const;

// Required-field set matches what the carrier portal UI enforces so direct
// API consumers can't save half-populated driver rows. phone/email/payType/
// payRate were previously `.notRequired()` — that drifted from the UI rules
// and let partial drivers slip through.
const driverEntrySchema = Yup.object({
  id: Yup.string().uuid('Invalid driver id').optional(),
  firstName: Yup.string().trim().required('firstName is required').max(100),
  lastName: Yup.string().trim().required('lastName is required').max(100),
  phone: Yup.string().trim().required('phone is required').max(20),
  email: Yup.string().trim().email('email must be valid').required('email is required'),
  payType: Yup.string()
    .oneOf([...PAY_TYPES], 'payType must be PERCENTAGE, PER_MILE, PER_HOUR, or FLAT_RATE')
    .required('payType is required'),
  payRate: Yup.number()
    .typeError('payRate must be a number')
    .min(0, 'payRate must be >= 0')
    .max(100, 'payRate must be <= 100')
    .required('payRate is required'),
});

export const driversValidator = Yup.object({
  body: Yup.object({
    hasAdditionalDrivers: Yup.boolean().required('hasAdditionalDrivers is required'),
    drivers: Yup.array()
      .of(driverEntrySchema)
      .max(50, 'drivers array cannot exceed 50 entries')
      .notRequired(),
  }),
});
