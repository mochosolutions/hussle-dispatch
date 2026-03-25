import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';

export interface PlaceStatsResult {
  visitCount: number;
  lastVisitDate: string | null;
}

export interface PlaceStatsQueryPort {
  getStats: (placeId: string) => Promise<PlaceStatsResult>;
}

export const placeStatsQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): PlaceStatsQueryPort => ({
  getStats: async (placeId) => {
    const [visitCount, aggregate] = await Promise.all([
      prisma.stop.count({ where: { placeId } }),
      prisma.stop.aggregate({
        where: { placeId },
        _max: { appointmentDate: true },
      }),
    ]);

    const lastVisitDate = aggregate._max.appointmentDate?.toISOString() ?? null;

    return { visitCount, lastVisitDate };
  },
});
