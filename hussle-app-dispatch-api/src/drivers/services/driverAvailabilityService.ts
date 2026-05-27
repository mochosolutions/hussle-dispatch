import type { DriverAvailability, DriverScheduleOverride } from '@prisma/client';
import { NotFoundError, ValidationError } from '@/shared/errors';
import { resolveDriverAvailability } from '@/shared/utils/driverAvailability';
import type {
  DeleteOverrideInput,
  DriverAvailabilityRepoPort,
  DriverAvailabilityWindow,
  ListOverridesInput,
  ScheduleOverrideInput,
  SetWeeklyScheduleInput,
} from '../types/driverAvailabilityTypes';
import type { DriverRepositoryPort } from '../types/driverTypes';

const DEFAULT_TIMEZONE = 'America/Chicago';

interface DriverAvailabilityServiceDeps {
  availabilityRepo: DriverAvailabilityRepoPort;
  driverRepo: DriverRepositoryPort;
}

const findDriverOrThrow = async (
  driverId: string,
  organizationId: string,
  deps: DriverAvailabilityServiceDeps,
) => {
  const driver = await deps.driverRepo.findById(driverId, organizationId);
  if (driver === null) {
    throw new NotFoundError('Driver not found.');
  }
  return driver;
};

export const setWeeklySchedule = async (
  input: SetWeeklyScheduleInput,
  deps: DriverAvailabilityServiceDeps,
): Promise<DriverAvailability[]> => {
  await findDriverOrThrow(input.driverId, input.organizationId, deps);

  return deps.availabilityRepo.upsertWeeklySchedule(input.driverId, input.entries);
};

export const getWeeklySchedule = async (
  input: { driverId: string; organizationId: string },
  deps: DriverAvailabilityServiceDeps,
): Promise<DriverAvailability[]> => {
  await findDriverOrThrow(input.driverId, input.organizationId, deps);

  return deps.availabilityRepo.getWeeklySchedule(input.driverId);
};

export const createOverride = async (
  input: ScheduleOverrideInput,
  deps: DriverAvailabilityServiceDeps,
): Promise<DriverScheduleOverride> => {
  await findDriverOrThrow(input.driverId, input.organizationId, deps);

  if (input.type === 'MODIFIED' || input.type === 'ADDED') {
    if (!input.startTime || !input.endTime) {
      throw new ValidationError(
        'startTime and endTime are required for MODIFIED and ADDED overrides.',
      );
    }
  }

  const { organizationId: _organizationId, ...repoData } = input;
  return deps.availabilityRepo.createOverride(repoData);
};

export const listOverrides = async (
  input: ListOverridesInput,
  deps: DriverAvailabilityServiceDeps,
): Promise<DriverScheduleOverride[]> => {
  await findDriverOrThrow(input.driverId, input.organizationId, deps);

  const fromDate = input.fromDate ? new Date(input.fromDate) : undefined;
  const toDate = input.toDate ? new Date(input.toDate) : undefined;

  return deps.availabilityRepo.listOverrides(input.driverId, fromDate, toDate);
};

export const deleteOverride = async (
  input: DeleteOverrideInput,
  deps: DriverAvailabilityServiceDeps,
): Promise<void> => {
  await findDriverOrThrow(input.driverId, input.organizationId, deps);

  await deps.availabilityRepo.deleteOverride(input.overrideId);
};

export const checkAvailabilityAt = async (
  input: { driverId: string; organizationId: string; atUtc: Date },
  deps: DriverAvailabilityServiceDeps,
): Promise<DriverAvailabilityWindow> => {
  const driver = await findDriverOrThrow(input.driverId, input.organizationId, deps);
  const timezone = driver.timezone ?? DEFAULT_TIMEZONE;

  const weeklySchedule = await deps.availabilityRepo.getWeeklySchedule(input.driverId);
  const overrides = await deps.availabilityRepo.getOverridesForDate(input.driverId, input.atUtc);

  return resolveDriverAvailability({
    weeklySchedule: weeklySchedule.map((entry) => ({
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      is24Hours: entry.is24Hours,
    })),
    overrides: overrides.map((override) => ({
      date: override.date,
      type: override.type,
      startTime: override.startTime,
      endTime: override.endTime,
    })),
    timezone,
    atUtc: input.atUtc,
  });
};
