import * as Yup from 'yup';

const optionalTrimmed = Yup.string().trim().notRequired();

const ccEmailsSchema = Yup.array()
  .of(Yup.string().trim().email('ccEmails entries must be valid email addresses').required())
  .notRequired();

const createBodySchema = Yup.object({
  customerId: Yup.string().uuid('customerId must be a valid uuid').nullable().notRequired(),
  role: optionalTrimmed,
  firstName: Yup.string().trim().min(3, 'firstName must be at least 3 characters').required('firstName is required'),
  lastName: Yup.string().trim().min(3, 'lastName must be at least 3 characters').required('lastName is required'),
  phone: optionalTrimmed,
  email: Yup.string().trim().email('email must be valid').notRequired(),
  ccEmails: ccEmailsSchema,
  notes: optionalTrimmed,
});

const updateBodySchema = createBodySchema
  .shape({
    firstName: Yup.string().trim().min(3, 'firstName must be at least 3 characters').notRequired(),
    lastName: Yup.string().trim().min(3, 'lastName must be at least 3 characters').notRequired(),
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
    customerId: Yup.string().uuid().notRequired(),
    search: Yup.string().trim().notRequired(),
  }),
});

export const contactIdParamValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});
