interface WeeklyScheduleEntry {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  is24Hours: boolean;
}

interface ScheduleOverride {
  date: Date;
  type: string;
  startTime?: string | null;
  endTime?: string | null;
}

interface ResolveAvailabilityInput {
  weeklySchedule: WeeklyScheduleEntry[];
  overrides: ScheduleOverride[];
  timezone: string;
  atUtc: Date;
}

interface AvailabilityResult {
  available: boolean;
  windowStart: string | null;
  windowEnd: string | null;
  source: 'override' | 'weekly' | 'none';
}

const JS_DAY_TO_DAY_OF_WEEK: Record<number, string> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

const getLocalDateParts = (
  utcDate: Date,
  timezone: string
): { dayOfWeek: string; dateStr: string; timeStr: string } => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(utcDate);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hour === '24' ? '00' : hour}:${minute}`;

  // Derive day-of-week from a Date constructed in local terms
  const localDate = new Date(`${dateStr}T12:00:00`);
  const jsDay = localDate.getDay();
  const dayOfWeek = JS_DAY_TO_DAY_OF_WEEK[jsDay] ?? 'SUNDAY';

  return { dayOfWeek, dateStr, timeStr };
};

const formatOverrideDate = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isTimeInWindow = (
  currentTime: string,
  startTime: string,
  endTime: string
): boolean => {
  const toMinutes = (t: string): number => {
    const parts = t.split(':').map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    return h * 60 + m;
  };

  const current = toMinutes(currentTime);
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  return current >= start && current <= end;
};

export const resolveDriverAvailability = (
  input: ResolveAvailabilityInput
): AvailabilityResult => {
  const { weeklySchedule, overrides, timezone, atUtc } = input;
  const { dayOfWeek, dateStr, timeStr } = getLocalDateParts(atUtc, timezone);

  // Check overrides first — they take priority
  const matchingOverride = overrides.find(
    (o) => formatOverrideDate(o.date) === dateStr
  );

  if (matchingOverride) {
    if (matchingOverride.type === 'OFF') {
      return { available: false, windowStart: null, windowEnd: null, source: 'override' };
    }

    // MODIFIED or ADDED
    const windowStart = matchingOverride.startTime ?? null;
    const windowEnd = matchingOverride.endTime ?? null;

    return { available: true, windowStart, windowEnd, source: 'override' };
  }

  // Check weekly schedule
  const scheduleEntry = weeklySchedule.find((e) => e.dayOfWeek === dayOfWeek);

  if (!scheduleEntry) {
    return { available: false, windowStart: null, windowEnd: null, source: 'none' };
  }

  if (scheduleEntry.is24Hours) {
    return { available: true, windowStart: '00:00', windowEnd: '23:59', source: 'weekly' };
  }

  const withinWindow = isTimeInWindow(
    timeStr,
    scheduleEntry.startTime,
    scheduleEntry.endTime
  );

  return {
    available: withinWindow,
    windowStart: scheduleEntry.startTime,
    windowEnd: scheduleEntry.endTime,
    source: 'weekly',
  };
};
