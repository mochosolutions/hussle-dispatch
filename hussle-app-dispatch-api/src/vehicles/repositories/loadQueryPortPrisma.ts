import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { LoadRepositoryPort } from '../types/vehicleTypes';

export const createLoadQueryPort = (
  prisma: PrismaClient | PrismaTransaction,
): LoadRepositoryPort => ({
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
});
