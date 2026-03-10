import * as Yup from 'yup';

const optionalTrimmed = Yup.string().trim().notRequired();

const stateCodeValidator = Yup.string()
  .trim()
  .uppercase()
  .matches(/^[A-Z]{2}$/, 'state must be a valid 2-letter state code');

const preferredLaneSchema = Yup.object({
  originState: stateCodeValidator.required('originState is required'),
  destState: stateCodeValidator.required('destState is required'),
  originCity: optionalTrimmed,
  destCity: optionalTrimmed,
});

const noGoZoneSchema = Yup.object({
  state: stateCodeValidator.required('state is required'),
  city: optionalTrimmed,
});

const createBodySchema = Yup.object({
  carrierId: Yup.string().uuid('carrierId must be a valid uuid').required('carrierId is required'),
  firstName: Yup.string().trim().required('firstName is required'),
  lastName: Yup.string().trim().required('lastName is required'),
  phone: optionalTrimmed,
  email: Yup.string().trim().email('email must be valid').notRequired(),
  cdlNumber: optionalTrimmed,
  cdlState: stateCodeValidator.notRequired(),
  cdlExpiry: Yup.date().notRequired(),
  availableHours: Yup.number().min(0).notRequired(),
  currentCity: optionalTrimmed,
  currentState: stateCodeValidator.notRequired(),
  homeBaseCity: optionalTrimmed,
  homeBaseState: stateCodeValidator.notRequired(),
  maxDaysOut: Yup.number().integer().min(1).notRequired(),
  preferredLanes: Yup.array().of(preferredLaneSchema).notRequired(),
  noGoZones: Yup.array().of(noGoZoneSchema).notRequired(),
  isAvailable: Yup.boolean().notRequired(),
  status: optionalTrimmed,
  notes: optionalTrimmed,
});

const updateBodySchema = createBodySchema
  .shape({
    carrierId: Yup.string().uuid('carrierId must be a valid uuid').notRequired(),
    firstName: Yup.string().trim().notRequired(),
    lastName: Yup.string().trim().notRequired(),
  })
  .test('has-any-field', 'At least one field must be provided', (value) => {
    if (value === undefined) {
      return false;
    }

    return Object.keys(value).length > 0;
  });

export const createDriverValidator = Yup.object({
  body: createBodySchema,
});

export const updateDriverValidator = Yup.object({
  body: updateBodySchema,
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const listDriversValidator = Yup.object({
  query: Yup.object({
    page: Yup.number().integer().min(1).notRequired(),
    limit: Yup.number().integer().min(1).max(100).notRequired(),
    sort: Yup.string().trim().notRequired(),
    order: Yup.string().oneOf(['asc', 'desc']).notRequired(),
    carrierId: Yup.string().uuid('carrierId must be a valid uuid').notRequired(),
    search: Yup.string().trim().notRequired(),
  }),
});

export const driverIdParamValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const driverLoadHistoryValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  query: Yup.object({
    page: Yup.number().integer().min(1).notRequired(),
    limit: Yup.number().integer().min(1).max(100).notRequired(),
  }),
});
