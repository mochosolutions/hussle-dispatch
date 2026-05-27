import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { DriverAvailabilityRepoPort } from '../types/driverAvailabilityTypes';

export const driverAvailabilityRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): DriverAvailabilityRepoPort => ({
  upsertWeeklySchedule: async (driverId, entries) => {
    const results = await (prisma as PrismaClient).$transaction(async (tx) => {
      await tx.driverAvailability.deleteMany({
        where: { driverId },
      });

      return Promise.all(
        entries.map((entry) =>
          tx.driverAvailability.create({
            data: {
              driverId,
              dayOfWeek: entry.dayOfWeek,
              startTime: entry.startTime,
              endTime: entry.endTime,
              is24Hours: entry.is24Hours,
            },
          }),
        ),
      );
    });

    return results;
  },

  getWeeklySchedule: (driverId) =>
    prisma.driverAvailability.findMany({
      where: { driverId },
      orderBy: { dayOfWeek: 'asc' },
    }),

  createOverride: (data) =>
    prisma.driverScheduleOverride.create({
      data: {
        driverId: data.driverId,
        date: new Date(data.date),
        type: data.type,
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        reason: data.reason ?? null,
      },
    }),

  listOverrides: (driverId, fromDate, toDate) => {
    const dateFilter: Record<string, Date> = {};

    if (fromDate !== undefined) {
      dateFilter.gte = fromDate;
    }

    if (toDate !== undefined) {
      dateFilter.lte = toDate;
    }

    return prisma.driverScheduleOverride.findMany({
      where: {
        driverId,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      orderBy: { date: 'asc' },
    });
  },

  deleteOverride: async (id) => {
    await prisma.driverScheduleOverride.delete({
      where: { id },
    });
  },

  getOverridesForDate: (driverId, date) =>
    prisma.driverScheduleOverride.findMany({
      where: {
        driverId,
        date,
      },
    }),
});
