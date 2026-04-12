import { DayOfWeek, ScheduleOverrideType } from '@prisma/client';
import * as Yup from 'yup';

const dayOfWeekValues = Object.values(DayOfWeek);
const scheduleOverrideTypeValues = Object.values(ScheduleOverrideType);

const driverIdParam = Yup.object({
  driverId: Yup.string()
    .uuid('driverId must be a valid uuid')
    .required('driverId is required'),
});

const timeFormat = Yup.string()
  .matches(/^\d{2}:\d{2}$/, 'must be in HH:mm format');

const weeklyScheduleEntrySchema = Yup.object({
  dayOfWeek: Yup.mixed<DayOfWeek>()
    .oneOf(dayOfWeekValues, 'dayOfWeek must be a valid DayOfWeek')
    .required('dayOfWeek is required'),
  startTime: timeFormat.required('startTime is required'),
  endTime: timeFormat.required('endTime is required'),
  is24Hours: Yup.boolean().notRequired(),
});

export const setWeeklyScheduleValidator = Yup.object({
  params: driverIdParam,
  body: Yup.object({
    entries: Yup.array()
      .of(weeklyScheduleEntrySchema)
      .required('entries is required'),
  }),
});

export const getWeeklyScheduleValidator = Yup.object({
  params: driverIdParam,
});

export const createOverrideValidator = Yup.object({
  params: driverIdParam,
  body: Yup.object({
    date: Yup.date().required('date is required'),
    type: Yup.mixed<ScheduleOverrideType>()
      .oneOf(scheduleOverrideTypeValues, 'type must be a valid ScheduleOverrideType')
      .required('type is required'),
    startTime: timeFormat.notRequired(),
    endTime: timeFormat.notRequired(),
    reason: Yup.string().trim().notRequired(),
  }),
});

export const listOverridesValidator = Yup.object({
  params: driverIdParam,
  query: Yup.object({
    fromDate: Yup.date().notRequired(),
    toDate: Yup.date().notRequired(),
  }),
});

export const deleteOverrideValidator = Yup.object({
  params: Yup.object({
    driverId: Yup.string()
      .uuid('driverId must be a valid uuid')
      .required('driverId is required'),
    overrideId: Yup.string()
      .uuid('overrideId must be a valid uuid')
      .required('overrideId is required'),
  }),
});
