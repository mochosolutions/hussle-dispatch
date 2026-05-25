import * as Yup from 'yup';

export const companyInfoSchema = Yup.object().shape({
  name: Yup.string().required('Legal name is required').min(2, 'Min 2 characters'),
  mcNumber: Yup.string().min(5, 'Min 5 characters'),
  dotNumber: Yup.string(),
  ein: Yup.string(),
  phone: Yup.string().required('Phone is required'),
  email: Yup.string().email('Invalid email'),
  address: Yup.string(),
  city: Yup.string(),
  state: Yup.string(),
  zip: Yup.string(),
  lat: Yup.number().nullable().default(null),
  lng: Yup.number().nullable().default(null),
});

export const dispatchTermsSchema = Yup.object().shape({
  companyMarginPercent: Yup.number()
    .min(0, 'Min 0%')
    .max(100, 'Max 100%')
    .default(0),
  dispatchFeeType: Yup.mixed<'PERCENTAGE' | 'FLAT'>()
    .oneOf(['PERCENTAGE', 'FLAT'])
    .default('PERCENTAGE'),
  dispatchFeeAmount: Yup.number().min(0, 'Min 0').default(0),
  feeIncludesAccessorials: Yup.boolean().default(true),
});
