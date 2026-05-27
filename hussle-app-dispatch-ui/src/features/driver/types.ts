// ---------------------------------------------------------------------------
// Driver Schedule types (mirrors API driverAvailabilityTypes)
// ---------------------------------------------------------------------------

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type ScheduleOverrideType = 'OFF' | 'MODIFIED' | 'ADDED';

export interface WeeklyScheduleEntry {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  is24Hours: boolean;
}

export interface ScheduleOverride {
  id: string;
  driverId: string;
  date: string;
  type: ScheduleOverrideType;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleOverrideInput {
  date: string;
  type: ScheduleOverrideType;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export const DAY_OF_WEEK_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};
