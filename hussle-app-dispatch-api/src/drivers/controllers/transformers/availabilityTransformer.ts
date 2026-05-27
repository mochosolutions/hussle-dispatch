import type { DriverAvailability, DriverScheduleOverride } from '@prisma/client';

export interface WeeklyScheduleEntryResponse {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  is24Hours: boolean;
}

export interface ScheduleOverrideResponse {
  id: string;
  date: string;
  type: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export const toWeeklyScheduleEntryResponse = (
  entry: DriverAvailability,
): WeeklyScheduleEntryResponse => ({
  dayOfWeek: entry.dayOfWeek,
  startTime: entry.startTime,
  endTime: entry.endTime,
  is24Hours: entry.is24Hours,
});

export const toWeeklyScheduleResponse = (
  entries: DriverAvailability[],
): WeeklyScheduleEntryResponse[] => entries.map(toWeeklyScheduleEntryResponse);

export const toScheduleOverrideResponse = (
  override: DriverScheduleOverride,
): ScheduleOverrideResponse => ({
  id: override.id,
  date: override.date.toISOString(),
  type: override.type,
  startTime: override.startTime ?? null,
  endTime: override.endTime ?? null,
  reason: override.reason ?? null,
});

export const toScheduleOverrideListResponse = (
  overrides: DriverScheduleOverride[],
): ScheduleOverrideResponse[] => overrides.map(toScheduleOverrideResponse);
