import * as Yup from 'yup';
import { ContactType } from '@prisma/client';

const contactTypeValues = Object.values(ContactType);

const optionalTrimmed = Yup.string().trim().notRequired();

const createBodySchema = Yup.object({
  type: Yup.mixed<ContactType>()
    .oneOf(contactTypeValues, 'type must be a valid ContactType')
    .required('type is required'),
  companyName: Yup.string().trim().required('companyName is required'),
  contactName: optionalTrimmed,
  phone: optionalTrimmed,
  email: Yup.string().trim().email('email must be valid').notRequired(),
  mcNumber: optionalTrimmed,
  address: optionalTrimmed,
  city: optionalTrimmed,
  state: optionalTrimmed,
  zip: optionalTrimmed,
  paymentTerms: optionalTrimmed,
  paymentTermsDays: Yup.number().integer().min(0).notRequired(),
  quickPayDiscount: Yup.number().min(0).max(100).notRequired(),
  carrierPacketSentAt: Yup.date().notRequired(),
  notes: optionalTrimmed,
});

const updateBodySchema = createBodySchema
  .shape({
    type: Yup.mixed<ContactType>()
      .oneOf(contactTypeValues, 'type must be a valid ContactType')
      .notRequired(),
    companyName: Yup.string().trim().notRequired(),
  })
  .test('has-any-field', 'At least one field must be provided', (value) => {
    if (value === undefined) {
      return false;
    }

    return Object.keys(value).length > 0;
  });

export const createContactValidator = Yup.object({
  body: createBodySchema,
});

export const updateContactValidator = Yup.object({
  body: updateBodySchema,
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const listContactsValidator = Yup.object({
  query: Yup.object({
    page: Yup.number().integer().min(1).notRequired(),
    limit: Yup.number().integer().min(1).max(100).notRequired(),
    sort: Yup.string().trim().notRequired(),
    order: Yup.string().oneOf(['asc', 'desc']).notRequired(),
    type: Yup.mixed<ContactType>().oneOf(contactTypeValues).notRequired(),
    search: Yup.string().trim().notRequired(),
  }),
});

export const contactIdParamValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});
