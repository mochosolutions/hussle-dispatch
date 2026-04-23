import * as Yup from 'yup';
import type { InferType } from 'yup';

export const contactSchema = Yup.object({
  customerId: Yup.string().uuid('Invalid customer ID').default(''),
  role: Yup.string().trim().default(''),
  firstName: Yup.string().trim().min(3, 'First name must be at least 3 characters').required('First name is required'),
  lastName: Yup.string().trim().min(3, 'Last name must be at least 3 characters').required('Last name is required'),
  phone: Yup.string().default(''),
  email: Yup.string().email('Invalid email').default(''),
  ccEmails: Yup.array()
    .of(Yup.string().trim().email('Each CC email must be a valid email').required())
    .default([]),
  notes: Yup.string().default(''),
}).required();

export type ContactFormValues = InferType<typeof contactSchema>;
