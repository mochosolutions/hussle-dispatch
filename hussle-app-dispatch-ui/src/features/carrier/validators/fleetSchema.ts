import * as Yup from 'yup';

export const companyInfoSchema = Yup.object().shape({
  name: Yup.string().required('Legal name is required').min(2, 'Min 2 characters'),
  mcNumber: Yup.string().required('MC number is required').min(5, 'Min 5 characters'),
  dotNumber: Yup.string(),
  ein: Yup.string(),
  phone: Yup.string().required('Phone is required'),
  email: Yup.string().email('Invalid email'),
  address: Yup.string(),
  city: Yup.string(),
  state: Yup.string(),
  zip: Yup.string(),
});

export const dispatchTermsSchema = Yup.object().shape({
  dispatchFeePercent: Yup.string().required('Required'),
  feeIncludesAccessorials: Yup.boolean(),
  dispatchAgreementOnFile: Yup.boolean(),
  dispatchAgreementSignedAt: Yup.string().nullable(),
});
