import type {
  DayOfWeek,
  DriverAvailability,
  DriverScheduleOverride,
  ScheduleOverrideType,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Domain Types
// ---------------------------------------------------------------------------

export interface WeeklyScheduleEntry {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  is24Hours: boolean;
}

export interface DriverAvailabilityWindow {
  available: boolean;
  windowStart: string | null;
  windowEnd: string | null;
  source: 'override' | 'weekly' | 'none';
}

// ---------------------------------------------------------------------------
// Service Inputs
// ---------------------------------------------------------------------------

export interface SetWeeklyScheduleInput {
  driverId: string;
  organizationId: string;
  entries: WeeklyScheduleEntry[];
}

export interface ScheduleOverrideInput {
  driverId: string;
  organizationId: string;
  date: Date | string;
  type: ScheduleOverrideType;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface ListOverridesInput {
  driverId: string;
  organizationId: string;
  fromDate?: Date | string;
  toDate?: Date | string;
}

export interface DeleteOverrideInput {
  driverId: string;
  organizationId: string;
  overrideId: string;
}

// ---------------------------------------------------------------------------
// Repository Port
// ---------------------------------------------------------------------------

export interface DriverAvailabilityRepoPort {
  upsertWeeklySchedule(
    driverId: string,
    entries: WeeklyScheduleEntry[],
  ): Promise<DriverAvailability[]>;
  getWeeklySchedule(driverId: string): Promise<DriverAvailability[]>;
  createOverride(
    data: Omit<ScheduleOverrideInput, 'organizationId'>,
  ): Promise<DriverScheduleOverride>;
  listOverrides(
    driverId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<DriverScheduleOverride[]>;
  deleteOverride(id: string): Promise<void>;
  getOverridesForDate(
    driverId: string,
    date: Date,
  ): Promise<DriverScheduleOverride[]>;
}
