import { SchedulingType, StopType } from '@prisma/client';
import * as Yup from 'yup';

const stopTypeValues = Object.values(StopType);
const schedulingTypeValues = Object.values(SchedulingType);

const optionalTrimmed = Yup.string().trim().notRequired();

const createStopBodySchema = Yup.object({
  type: Yup.mixed<StopType>()
    .oneOf(stopTypeValues, 'type must be a valid StopType')
    .required('stop type is required'),
  sequence: Yup.number().integer().positive('sequence must be positive').notRequired(),
  contactId: Yup.string().uuid().notRequired(),
  placeId: Yup.string().uuid().notRequired(),
  facilityName: Yup.string().trim().max(255, 'facilityName must be at most 255 characters')
    .required('facilityName is required'),
  address: Yup.string().trim().max(500, 'address must be at most 500 characters')
    .required('address is required'),
  city: Yup.string().trim().max(100, 'city must be at most 100 characters')
    .required('city is required'),
  state: Yup.string().trim().max(50, 'state must be at most 50 characters')
    .required('state is required'),
  zip: Yup.string().trim().max(20, 'zip must be at most 20 characters')
    .required('zip is required'),
  schedulingType: Yup.mixed<SchedulingType>()
    .oneOf(schedulingTypeValues, 'schedulingType must be a valid SchedulingType')
    .notRequired(),
  appointmentStart: Yup.date().nullable().notRequired(),
  appointmentEnd: Yup.date().nullable().notRequired(),
  targetDate: Yup.date().nullable().notRequired(),
  notificationHours: Yup.number().integer().nullable().notRequired(),
  appointmentNumber: optionalTrimmed,
  contactName: Yup.string().trim().max(255, 'contactName must be at most 255 characters')
    .notRequired(),
  contactPhone: Yup.string().trim().max(50, 'contactPhone must be at most 50 characters')
    .notRequired(),
  commodity: Yup.string().trim().notRequired(),
  weight: Yup.number().integer().min(0).notRequired(),
  pieceCount: Yup.number().integer().min(0).notRequired(),
  isHazmat: Yup.boolean().notRequired(),
  isTarp: Yup.boolean().notRequired(),
  isTempControlled: Yup.boolean().notRequired(),
  notes: Yup.string().trim().max(2000, 'notes must be at most 2000 characters').notRequired(),
  facilityOpenTime: optionalTrimmed,
  facilityCloseTime: optionalTrimmed,
  callByTime: optionalTrimmed,
  trailerNumber: optionalTrimmed,
  yardLocation: optionalTrimmed,
});

const updateStopBodySchema = Yup.object({
  type: Yup.mixed<StopType>()
    .oneOf(stopTypeValues, 'type must be a valid StopType')
    .notRequired(),
  sequence: Yup.number().integer().positive('sequence must be positive').notRequired(),
  contactId: Yup.string().uuid().notRequired(),
  placeId: Yup.string().uuid().notRequired(),
  facilityName: Yup.string().trim().max(255, 'facilityName must be at most 255 characters')
    .notRequired(),
  address: Yup.string().trim().max(500, 'address must be at most 500 characters').notRequired(),
  city: Yup.string().trim().max(100, 'city must be at most 100 characters').notRequired(),
  state: Yup.string().trim().max(50, 'state must be at most 50 characters').notRequired(),
  zip: Yup.string().trim().max(20, 'zip must be at most 20 characters').notRequired(),
  schedulingType: Yup.mixed<SchedulingType>()
    .oneOf(schedulingTypeValues, 'schedulingType must be a valid SchedulingType')
    .notRequired(),
  appointmentStart: Yup.date().nullable().notRequired(),
  appointmentEnd: Yup.date().nullable().notRequired(),
  targetDate: Yup.date().nullable().notRequired(),
  notificationHours: Yup.number().integer().nullable().notRequired(),
  appointmentNumber: optionalTrimmed,
  arrivalTime: Yup.date().notRequired(),
  departureTime: Yup.date().notRequired(),
  contactName: Yup.string().trim().max(255, 'contactName must be at most 255 characters')
    .notRequired(),
  contactPhone: Yup.string().trim().max(50, 'contactPhone must be at most 50 characters')
    .notRequired(),
  commodity: Yup.string().trim().notRequired(),
  weight: Yup.number().integer().min(0).notRequired(),
  pieceCount: Yup.number().integer().min(0).notRequired(),
  isHazmat: Yup.boolean().notRequired(),
  isTarp: Yup.boolean().notRequired(),
  isTempControlled: Yup.boolean().notRequired(),
  notes: Yup.string().trim().max(2000, 'notes must be at most 2000 characters').notRequired(),
  facilityOpenTime: optionalTrimmed,
  facilityCloseTime: optionalTrimmed,
  callByTime: optionalTrimmed,
  trailerNumber: optionalTrimmed,
  yardLocation: optionalTrimmed,
}).test('has-any-field', 'At least one field must be provided', (value) => {
  if (value === undefined) {
    return false;
  }
  return Object.keys(value).length > 0;
});

const stopOrderItemSchema = Yup.object({
  id: Yup.string().uuid('id must be a valid uuid').required('stop id is required'),
  sequence: Yup.number()
    .integer()
    .positive('sequence must be positive')
    .required('sequence is required'),
});

export const createStopSchema = Yup.object({
  params: Yup.object({
    loadId: Yup.string().uuid('loadId must be a valid uuid').required('loadId is required'),
  }),
  body: createStopBodySchema,
});

export const updateStopSchema = Yup.object({
  params: Yup.object({
    loadId: Yup.string().uuid('loadId must be a valid uuid').required('loadId is required'),
    stopId: Yup.string().uuid('stopId must be a valid uuid').required('stopId is required'),
  }),
  body: updateStopBodySchema,
});

export const reorderStopsSchema = Yup.object({
  params: Yup.object({
    loadId: Yup.string().uuid('loadId must be a valid uuid').required('loadId is required'),
  }),
  body: Yup.object({
    stopOrder: Yup.array()
      .of(stopOrderItemSchema)
      .min(1, 'stopOrder must have at least 1 item')
      .required('stopOrder is required'),
  }),
});

export const deleteStopSchema = Yup.object({
  params: Yup.object({
    loadId: Yup.string().uuid('loadId must be a valid uuid').required('loadId is required'),
    stopId: Yup.string().uuid('stopId must be a valid uuid').required('stopId is required'),
  }),
});
