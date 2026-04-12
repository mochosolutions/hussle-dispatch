import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { IftaReportQueryPort, MilesByStateRow, FuelByStateRow } from '../types/iftaTypes';

export const iftaReportQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): IftaReportQueryPort => ({
  getMilesByState: async (params) => {
    const vehicleFilter = params.vehicleId
      ? { vehicleId: params.vehicleId }
      : {};

    const loads = await prisma.load.findMany({
      where: {
        organizationId: params.organizationId,
        vehicleId: { not: null },
        createdAt: { gte: params.startDate, lte: params.endDate },
        deletedAt: null,
        ...vehicleFilter,
      },
      select: {
        id: true,
        vehicleId: true,
        vehicle: { select: { unitNumber: true } },
        stateMiles: { select: { state: true, miles: true } },
      },
    });

    const aggregation = new Map<string, MilesByStateRow>();

    loads.forEach((load) => {
      if (load.vehicleId === null || load.vehicle === null) {
        return;
      }

      load.stateMiles.forEach((sm) => {
        const key = `${load.vehicleId}:${sm.state}`;
        const existing = aggregation.get(key);

        if (existing) {
          existing.miles += sm.miles.toNumber();
        } else {
          aggregation.set(key, {
            vehicleId: load.vehicleId as string,
            unitNumber: load.vehicle?.unitNumber ?? '',
            state: sm.state,
            miles: sm.miles.toNumber(),
          });
        }
      });
    });

    return Array.from(aggregation.values());
  },

  getFuelByState: async (params) => {
    const vehicleFilter = params.vehicleId
      ? { vehicleId: params.vehicleId }
      : {};

    const expenses = await prisma.expense.findMany({
      where: {
        organizationId: params.organizationId,
        category: 'FUEL',
        fuelType: 'DIESEL',
        state: { not: null },
        vehicleId: { not: undefined },
        date: { gte: params.startDate, lte: params.endDate },
        deletedAt: null,
        ...vehicleFilter,
      },
      select: {
        vehicleId: true,
        state: true,
        gallons: true,
        amount: true,
      },
    });

    const aggregation = new Map<string, FuelByStateRow>();

    expenses.forEach((expense) => {
      const state = expense.state as string;
      const key = `${expense.vehicleId}:${state}`;
      const existing = aggregation.get(key);
      const gallons = expense.gallons?.toNumber() ?? 0;
      const cost = expense.amount.toNumber();

      if (existing) {
        existing.gallons += gallons;
        existing.cost += cost;
      } else {
        aggregation.set(key, {
          vehicleId: expense.vehicleId,
          state,
          gallons,
          cost,
        });
      }
    });

    return Array.from(aggregation.values());
  },
});
