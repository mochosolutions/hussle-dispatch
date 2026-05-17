import * as Yup from 'yup';

const PAY_TYPES = ['PERCENTAGE', 'PER_MILE', 'PER_HOUR', 'FLAT_RATE'] as const;

const driverEntrySchema = Yup.object({
  id: Yup.string().uuid('Invalid driver id').optional(),
  firstName: Yup.string().trim().required('firstName is required').max(100),
  lastName: Yup.string().trim().required('lastName is required').max(100),
  phone: Yup.string().trim().max(20).notRequired(),
  email: Yup.string().trim().email('email must be valid').notRequired(),
  payType: Yup.string().oneOf([...PAY_TYPES], 'payType must be PERCENTAGE, PER_MILE, PER_HOUR, or FLAT_RATE').notRequired(),
  payRate: Yup.number().min(0, 'payRate must be >= 0').max(100, 'payRate must be <= 100').notRequired(),
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
