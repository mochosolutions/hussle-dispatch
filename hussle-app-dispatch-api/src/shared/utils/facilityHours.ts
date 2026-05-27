import { ValidationError } from '../errors';

interface FacilityDayHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  is24Hours: boolean;
}

const DAYS_IN_WEEK = 7;
const TIME_REGEX = /^\d{2}:\d{2}$/;
const MINUTES_PER_HOUR = 60;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidTimeFormat = (time: string): boolean => {
  if (!TIME_REGEX.test(time)) {
    return false;
  }
  const parts = time.split(':').map((s) => parseInt(s, 10));
  const hours = parts[0] ?? -1;
  const minutes = parts[1] ?? -1;
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};

const validateDayEntry = (entry: unknown, index: number): FacilityDayHours => {
  if (!isRecord(entry)) {
    throw new ValidationError(`Facility hours entry at index ${index} must be an object`);
  }

  const { dayOfWeek, openTime, closeTime, isClosed, is24Hours } = entry;

  if (typeof dayOfWeek !== 'number' || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new ValidationError(`Facility hours entry at index ${index}: dayOfWeek must be an integer 0-6`);
  }

  if (typeof openTime !== 'string' || !isValidTimeFormat(openTime)) {
    throw new ValidationError(`Facility hours entry at index ${index}: openTime must be HH:mm format`);
  }

  if (typeof closeTime !== 'string' || !isValidTimeFormat(closeTime)) {
    throw new ValidationError(`Facility hours entry at index ${index}: closeTime must be HH:mm format`);
  }

  if (typeof isClosed !== 'boolean') {
    throw new ValidationError(`Facility hours entry at index ${index}: isClosed must be a boolean`);
  }

  if (typeof is24Hours !== 'boolean') {
    throw new ValidationError(`Facility hours entry at index ${index}: is24Hours must be a boolean`);
  }

  return { dayOfWeek, openTime, closeTime, isClosed, is24Hours };
};

/**
 * Validates that a value is a well-formed array of 7 FacilityDayHours entries,
 * one for each day of the week (0=Sunday through 6=Saturday).
 */
const validateFacilityHoursJson = (value: unknown): FacilityDayHours[] => {
  if (!Array.isArray(value)) {
    throw new ValidationError('Facility hours must be an array');
  }

  if (value.length !== DAYS_IN_WEEK) {
    throw new ValidationError(`Facility hours must contain exactly ${DAYS_IN_WEEK} entries`);
  }

  const entries = value.map((entry, index) => validateDayEntry(entry, index));

  const seenDays = new Set<number>();
  entries.forEach((entry) => {
    if (seenDays.has(entry.dayOfWeek)) {
      throw new ValidationError(`Duplicate dayOfWeek: ${entry.dayOfWeek}`);
    }
    seenDays.add(entry.dayOfWeek);
  });

  if (seenDays.size !== DAYS_IN_WEEK) {
    throw new ValidationError('Facility hours must include all days 0-6');
  }

  return entries;
};

/**
 * Converts a UTC Date to local hour and minute in the given IANA timezone.
 */
const toLocalTime = (
  utcDate: Date,
  timezone: string
): { dayOfWeek: number; hour: number; minute: number } => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(utcDate);
  const hourPart = parts.find((p) => p.type === 'hour');
  const minutePart = parts.find((p) => p.type === 'minute');
  const weekdayPart = parts.find((p) => p.type === 'weekday');

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const hour = parseInt(hourPart?.value ?? '0', 10);
  const minute = parseInt(minutePart?.value ?? '0', 10);
  const dayOfWeek = dayMap[weekdayPart?.value ?? 'Sun'] ?? 0;

  return { dayOfWeek, hour, minute };
};

/**
 * Parses an "HH:mm" string into total minutes since midnight.
 */
const timeToMinutes = (time: string): number => {
  const parts = time.split(':').map((s) => parseInt(s, 10));
  return (parts[0] ?? 0) * MINUTES_PER_HOUR + (parts[1] ?? 0);
};

interface IsFacilityOpenAtOptions {
  hours: FacilityDayHours[];
  facilityIs24Hours: boolean;
  timezone: string;
  atUtc: Date;
}

/**
 * Determines whether a facility is open at a specific UTC instant.
 *
 * @param options.hours - validated array of 7 FacilityDayHours entries
 * @param options.facilityIs24Hours - if true, facility is always open regardless of schedule
 * @param options.timezone - IANA timezone of the facility (e.g. "America/Chicago")
 * @param options.atUtc - the UTC instant to check
 */
const isFacilityOpenAt = (options: IsFacilityOpenAtOptions): boolean => {
  const { hours, facilityIs24Hours, timezone, atUtc } = options;

  if (facilityIs24Hours) {
    return true;
  }

  const local = toLocalTime(atUtc, timezone);
  const dayEntry = hours.find((h) => h.dayOfWeek === local.dayOfWeek);

  if (!dayEntry || dayEntry.isClosed) {
    return false;
  }

  if (dayEntry.is24Hours) {
    return true;
  }

  const currentMinutes = local.hour * MINUTES_PER_HOUR + local.minute;
  const openMinutes = timeToMinutes(dayEntry.openTime);
  const closeMinutes = timeToMinutes(dayEntry.closeTime);

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
};

interface LocalTimeToUtcOptions {
  referenceUtc: Date;
  timezone: string;
  targetDayOfWeek: number;
  timeStr: string;
}

/**
 * Creates a UTC Date for a given local time in the specified timezone,
 * starting from a reference UTC date and offsetting to the target local day/time.
 */
const localTimeToUtc = (options: LocalTimeToUtcOptions): Date => {
  const { referenceUtc, timezone, targetDayOfWeek, timeStr } = options;
  const refLocal = toLocalTime(referenceUtc, timezone);
  let dayOffset = targetDayOfWeek - refLocal.dayOfWeek;
  if (dayOffset < 0) {
    dayOffset += DAYS_IN_WEEK;
  }

  const timeParts = timeStr.split(':').map((s) => parseInt(s, 10));
  const targetHour = timeParts[0] ?? 0;
  const targetMinute = timeParts[1] ?? 0;
  const currentMinutes = refLocal.hour * MINUTES_PER_HOUR + refLocal.minute;
  const targetMinutes = targetHour * MINUTES_PER_HOUR + targetMinute;

  const minuteOffset = dayOffset * 24 * MINUTES_PER_HOUR + (targetMinutes - currentMinutes);

  return new Date(referenceUtc.getTime() + minuteOffset * 60 * 1000);
};

/**
 * Finds the next open window starting from a given UTC instant.
 * Searches up to 7 days ahead. Returns null if the facility is always closed.
 *
 * @param hours - validated array of 7 FacilityDayHours entries
 * @param timezone - IANA timezone of the facility
 * @param fromUtc - the UTC instant to start searching from
 */
const getNextOpenWindow = (
  hours: FacilityDayHours[],
  timezone: string,
  fromUtc: Date,
): { openUtc: Date; closeUtc: Date } | null => {
  const local = toLocalTime(fromUtc, timezone);

  for (let offset = 0; offset < DAYS_IN_WEEK; offset += 1) {
    const targetDay = (local.dayOfWeek + offset) % DAYS_IN_WEEK;
    const dayEntry = hours.find((h) => h.dayOfWeek === targetDay);

    if (!dayEntry || dayEntry.isClosed) {
      continue;
    }

    const openMinutes = dayEntry.is24Hours ? 0 : timeToMinutes(dayEntry.openTime);
    const closeMinutes = dayEntry.is24Hours ? 24 * MINUTES_PER_HOUR : timeToMinutes(dayEntry.closeTime);
    const effectiveOpenTime = dayEntry.is24Hours ? '00:00' : dayEntry.openTime;
    const effectiveCloseTime = dayEntry.is24Hours ? '24:00' : dayEntry.closeTime;

    // For today, check if we're still before the close time
    if (offset === 0) {
      const currentMinutes = local.hour * MINUTES_PER_HOUR + local.minute;

      if (currentMinutes < closeMinutes) {
        const openUtc = currentMinutes >= openMinutes
          ? fromUtc
          : localTimeToUtc({ referenceUtc: fromUtc, timezone, targetDayOfWeek: targetDay, timeStr: effectiveOpenTime });
        const closeUtc = localTimeToUtc({ referenceUtc: fromUtc, timezone, targetDayOfWeek: targetDay, timeStr: effectiveCloseTime });
        return { openUtc, closeUtc };
      }
      // Already past close time today, check next days
      continue;
    }

    const openUtc = localTimeToUtc({ referenceUtc: fromUtc, timezone, targetDayOfWeek: targetDay, timeStr: effectiveOpenTime });
    const closeUtc = localTimeToUtc({ referenceUtc: fromUtc, timezone, targetDayOfWeek: targetDay, timeStr: effectiveCloseTime });
    return { openUtc, closeUtc };
  }

  return null;
};

export type { FacilityDayHours, IsFacilityOpenAtOptions };
export { validateFacilityHoursJson, isFacilityOpenAt, getNextOpenWindow };
