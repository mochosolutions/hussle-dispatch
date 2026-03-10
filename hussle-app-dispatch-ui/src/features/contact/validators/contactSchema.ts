import * as Yup from 'yup';
import type { InferType } from 'yup';
import type { ContactType } from '../types';

export const contactSchema = Yup.object({
  companyName: Yup.string().required('Company name is required').min(2, 'Min 2 characters'),
  type: Yup.mixed<ContactType>()
    .oneOf(['BROKER', 'SHIPPER', 'CONSIGNEE', 'FACTORING'], 'Invalid contact type')
    .required('Type is required'),
  contactName: Yup.string().default(''),
  phone: Yup.string().default(''),
  email: Yup.string().email('Invalid email').default(''),
  mcNumber: Yup.string().default(''),
  address: Yup.string().default(''),
  city: Yup.string().default(''),
  state: Yup.string().default(''),
  zip: Yup.string().default(''),
  paymentTerms: Yup.string().default('Net 30'),
  paymentTermsDays: Yup.number().min(0, 'Must be 0 or greater').default(30),
  quickPayDiscount: Yup.string().default(''),
  notes: Yup.string().default(''),
}).required();

export type ContactFormValues = InferType<typeof contactSchema>;
