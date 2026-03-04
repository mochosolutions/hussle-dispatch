import * as Yup from 'yup';
import type { InferType } from 'yup';

// OWNER_OPERATOR is rejected at runtime (decision L-010)
const CARRIER_TYPES = ['COMPANY_ASSET', 'EXTERNAL_CARRIER'] as const;
type CarrierType = (typeof CARRIER_TYPES)[number];

export const carrierSchema = Yup.object({
  name: Yup.string().required('Name is required').trim(),
  type: Yup.mixed<CarrierType>()
    .oneOf([...CARRIER_TYPES], 'Invalid carrier type')
    .required('Type is required'),
  mcNumber: Yup.string().optional(),
  dotNumber: Yup.string().optional(),
  phone: Yup.string().optional(),
  email: Yup.string().email('Invalid email').optional(),
  address: Yup.string().optional(),
  city: Yup.string().optional(),
  state: Yup.string().optional(),
  zip: Yup.string().optional(),
  dispatchFeePercent: Yup.string().optional(),
  partnerSplitPercent: Yup.string().optional(),
  feeIncludesAccessorials: Yup.boolean().optional(),
  dispatchAgreementOnFile: Yup.boolean().optional(),
  insuranceCertOnFile: Yup.boolean().optional(),
  w9OnFile: Yup.boolean().optional(),
  carrierPacketOnFile: Yup.boolean().optional(),
  insuranceExpiry: Yup.date().nullable().optional(),
  notes: Yup.string().optional(),
}).required();

export type CarrierFormValues = InferType<typeof carrierSchema>;
