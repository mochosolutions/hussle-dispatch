import * as Yup from 'yup';
import type { InferType } from 'yup';
import type { CarrierType, DispatchFeeType } from '../types';

/**
 * Schema for the full onboarding create-carrier form (CreateCarrierPage).
 */
export const carrierSchema = Yup.object({
  name: Yup.string().required('Legal name is required').min(2, 'Min 2 characters').required(),
  email: Yup.string().email('Invalid email').required(),
  type: Yup.mixed<CarrierType>()
    .oneOf(['COMPANY_ASSET', 'EXTERNAL_CARRIER', 'LEASED_CARRIER'])
    .required('Type is required'),
  mcNumber: Yup.string()
    .default('')
    .test('mc-min', 'Min 5 characters', (value) => !value || value.length >= 5),
  dotNumber: Yup.string().default(''),
  ein: Yup.string()
    .default('')
    .test(
      'ein-format',
      'EIN must be 9 digits',
      (value) => !value || /^\d{9}$/.test(value),
    ),
  phone: Yup.string().required('Phone is required').min(10, 'Enter a valid phone'),
  address: Yup.string().required('Address is required'),
  city: Yup.string().default(''),
  state: Yup.string().default(''),
  zip: Yup.string().default(''),
  lat: Yup.number().nullable().default(null),
  lng: Yup.number().nullable().default(null),
  notes: Yup.string().default(''),
  dispatchFeeType: Yup.mixed<DispatchFeeType>()
    .oneOf(['PERCENTAGE', 'FLAT'])
    .default('PERCENTAGE')
    .required('Dispatch fee type is required'),
  companyMarginPercent: Yup.number()
    .min(0, 'Min 0%')
    .max(100, 'Max 100%')
    .when('dispatchFeeType', {
      is: 'PERCENTAGE',
      then: (schema) => schema.required('Company margin is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
  dispatchFeeAmount: Yup.number()
    .min(0, 'Min 0')
    .when('dispatchFeeType', {
      is: 'FLAT',
      then: (schema) => schema.required('Dispatch fee amount is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
});

export type CarrierFormValues = InferType<typeof carrierSchema>;

/**
 * Schema for the edit/quick-add carrier form (CarrierFormDialog, CreateCarrierForm).
 */
export const carrierEditSchema = Yup.object({
  name: Yup.string().required('Name is required').min(2, 'Min 2 characters'),
  type: Yup.mixed<CarrierType>()
    .oneOf(['COMPANY_ASSET', 'EXTERNAL_CARRIER', 'LEASED_CARRIER'])
    .required('Type is required'),
  mcNumber: Yup.string(),
  dotNumber: Yup.string(),
  phone: Yup.string(),
  email: Yup.string().email('Invalid email'),
  address: Yup.string(),
  city: Yup.string(),
  state: Yup.string(),
  zip: Yup.string(),
  companyMarginPercent: Yup.number()
    .min(0, 'Min 0%')
    .max(100, 'Max 100%')
    .notRequired()
    .test(
      'external-carrier-percent-required',
      'External carriers require a dispatch fee greater than zero',
      function (value) {
        const { type, dispatchFeeType } = this.parent as {
          type?: CarrierType;
          dispatchFeeType?: DispatchFeeType;
        };
        if (type !== 'EXTERNAL_CARRIER' || dispatchFeeType === 'FLAT') {
          return true;
        }
        return (value ?? 0) > 0;
      },
    ),
  dispatchFeeType: Yup.mixed<DispatchFeeType>().oneOf(['PERCENTAGE', 'FLAT']).default('PERCENTAGE'),
  dispatchFeeAmount: Yup.number()
    .min(0, 'Min 0')
    .notRequired()
    .test(
      'external-carrier-flat-required',
      'External carriers require a dispatch fee greater than zero',
      function (value) {
        const { type, dispatchFeeType } = this.parent as {
          type?: CarrierType;
          dispatchFeeType?: DispatchFeeType;
        };
        if (type !== 'EXTERNAL_CARRIER' || dispatchFeeType !== 'FLAT') {
          return true;
        }
        return (value ?? 0) > 0;
      },
    ),
  feeIncludesAccessorials: Yup.boolean(),
  notes: Yup.string(),
}).required();

export type CarrierEditFormValues = InferType<typeof carrierEditSchema>;
