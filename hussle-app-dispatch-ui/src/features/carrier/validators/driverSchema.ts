import * as Yup from 'yup';

export const driverSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  phone: Yup.string().required('Phone is required'),
  cdlNumber: Yup.string(),
  cdlExpiry: Yup.string(),
  email: Yup.string().email('Invalid email'),
});
