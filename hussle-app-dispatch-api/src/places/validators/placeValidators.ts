import { FacilityType, DockType, GeoSource } from '@prisma/client';
import * as Yup from 'yup';

const facilityTypeValues = Object.values(FacilityType);
const dockTypeValues = Object.values(DockType);
const geoSourceValues = Object.values(GeoSource);

const optionalTrimmed = Yup.string().trim().notRequired();

const createBodySchema = Yup.object({
  name: Yup.string().trim().required('name is required'),
  city: Yup.string().trim().required('city is required'),
  state: Yup.string().trim().required('state is required'),
  contactId: Yup.string().uuid('contactId must be a valid uuid').notRequired(),
  customerId: Yup.string().uuid('customerId must be a valid uuid').notRequired(),
  address: optionalTrimmed,
  address2: optionalTrimmed,
  zip: optionalTrimmed,
  latitude: Yup.number().min(-90).max(90).notRequired(),
  longitude: Yup.number().min(-180).max(180).notRequired(),
  geoSource: Yup.mixed<GeoSource>()
    .oneOf(geoSourceValues, 'geoSource must be a valid GeoSource')
    .notRequired(),
  facilityType: Yup.mixed<FacilityType>()
    .oneOf(facilityTypeValues, 'facilityType must be a valid FacilityType')
    .notRequired(),
  facilityHours: Yup.array().notRequired(),
  is24Hours: Yup.boolean().notRequired(),
  timezone: optionalTrimmed,
  appointmentRequired: Yup.boolean().notRequired(),
  dockType: Yup.mixed<DockType>()
    .oneOf(dockTypeValues, 'dockType must be a valid DockType')
    .notRequired(),
  contactName: optionalTrimmed,
  contactPhone: optionalTrimmed,
  contactEmail: Yup.string().trim().email('contactEmail must be valid').notRequired(),
  checkInProcedures: optionalTrimmed,
  lumperRequired: Yup.boolean().notRequired(),
  ppeRequired: Yup.boolean().notRequired(),
  notes: optionalTrimmed,
  status: optionalTrimmed,
});

const updateBodySchema = createBodySchema
  .shape({
    name: Yup.string().trim().notRequired(),
    city: Yup.string().trim().notRequired(),
    state: Yup.string().trim().notRequired(),
  })
  .test('has-any-field', 'At least one field must be provided', (value) => {
    if (value === undefined) {
      return false;
    }
    return Object.keys(value).length > 0;
  });

export const createPlaceValidator = Yup.object({
  body: createBodySchema,
});

export const updatePlaceValidator = Yup.object({
  body: updateBodySchema,
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const listPlacesValidator = Yup.object({
  query: Yup.object({
    page: Yup.number().integer().min(1).notRequired(),
    limit: Yup.number().integer().min(1).max(100).notRequired(),
    sort: Yup.string().trim().notRequired(),
    order: Yup.string().oneOf(['asc', 'desc']).notRequired(),
    facilityType: Yup.mixed<FacilityType>().oneOf(facilityTypeValues).notRequired(),
    state: Yup.string().trim().notRequired(),
    contactId: Yup.string().uuid('contactId must be a valid uuid').notRequired(),
    customerId: Yup.string().uuid('customerId must be a valid uuid').notRequired(),
    search: Yup.string().trim().notRequired(),
  }),
});

export const placeIdParamValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
});

export const typeaheadValidator = Yup.object({
  query: Yup.object({
    q: Yup.string().trim().required('q is required'),
    limit: Yup.number().integer().min(1).max(20).notRequired(),
  }),
});

export const loadsAtFacilityValidator = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  query: Yup.object({
    page: Yup.number().integer().min(1).notRequired(),
    limit: Yup.number().integer().min(1).max(100).notRequired(),
  }),
});
