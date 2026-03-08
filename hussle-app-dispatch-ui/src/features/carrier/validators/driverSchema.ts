import * as Yup from 'yup';

export const driverSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  phone: Yup.string().required('Phone is required'),
  cdlNumber: Yup.string(),
  cdlExpiry: Yup.string(),
  email: Yup.string().email('Invalid email'),
});
