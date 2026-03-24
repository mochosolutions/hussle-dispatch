import * as Yup from 'yup';
import type { InferType } from 'yup';
import type { CustomerType, CustomerStatus } from '../types';

export const customerSchema = Yup.object({
  companyName: Yup.string().required('Company name is required').min(2, 'Min 2 characters'),
  type: Yup.mixed<CustomerType>()
    .oneOf(['BROKER', 'DIRECT_SHIPPER', 'THREE_PL'], 'Invalid customer type')
    .required('Type is required'),
  mcNumber: Yup.string().default(''),
  dotNumber: Yup.string().default(''),
  phone: Yup.string().default(''),
  email: Yup.string().email('Invalid email').default(''),
  website: Yup.string().url('Invalid URL').default(''),
  address: Yup.string().default(''),
  city: Yup.string().default(''),
  state: Yup.string().default(''),
  zip: Yup.string().default(''),
  paymentTerms: Yup.string().default('Net 30'),
  paymentTermsDays: Yup.number().min(0, 'Must be 0 or greater').default(30),
  quickPayDiscount: Yup.string().default(''),
  notes: Yup.string().default(''),
  status: Yup.mixed<CustomerStatus>()
    .oneOf(['ACTIVE', 'INACTIVE'], 'Invalid status')
    .default('ACTIVE'),
}).required();

export type CustomerFormValues = InferType<typeof customerSchema>;
