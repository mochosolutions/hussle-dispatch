import type { LoadStatus, PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { LoadRepositoryPort } from '../types/vehicleTypes';

const TERMINAL_STATUSES: LoadStatus[] = ['DELIVERED', 'CANCELED'];

export const createLoadQueryPort = (
  prisma: PrismaClient | PrismaTransaction,
): LoadRepositoryPort => ({
  findBlockingLoadIdsByDriver: async (driverId, statuses, limit) => {
    const loads = await prisma.load.findMany({
      where: {
        driverId,
        deletedAt: null,
        status: {
          in: [...statuses],
        },
      },
      select: {
        id: true,
      },
      take: limit,
    });

    return loads.map((load) => load.id);
  },

  findBlockingLoadIdsByVehicle: async (vehicleId, statuses, limit) => {
    const loads = await prisma.load.findMany({
      where: {
        vehicleId,
        deletedAt: null,
        status: {
          in: [...statuses],
        },
      },
      select: {
        id: true,
      },
      take: limit,
    });

    return loads.map((load) => load.id);
  },

  countActiveByVehicleIds: async (vehicleIds, orgId) => {
    const counts = await prisma.load.groupBy({
      by: ['vehicleId'],
      where: {
        vehicleId: { in: vehicleIds },
        organizationId: orgId,
        deletedAt: null,
        status: { notIn: TERMINAL_STATUSES },
      },
      _count: { vehicleId: true },
    });

    const result = new Map<string, number>();
    counts.forEach((row) => {
      if (row.vehicleId !== null) {
        result.set(row.vehicleId, row._count.vehicleId);
      }
    });

    return result;
  },
});
