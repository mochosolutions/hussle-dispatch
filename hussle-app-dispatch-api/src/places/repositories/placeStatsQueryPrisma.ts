import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';

export interface PlaceStatsResult {
  visitCount: number;
  lastVisitDate: string | null;
}

export interface PlaceStatsQueryPort {
  getStats: (placeId: string, organizationId: string) => Promise<PlaceStatsResult>;
}

export const placeStatsQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): PlaceStatsQueryPort => ({
  getStats: async (placeId, organizationId) => {
    const stopWhereClause = { placeId, load: { organizationId, deletedAt: null } };

    const [visitCount, aggregate] = await Promise.all([
      prisma.stop.count({ where: stopWhereClause }),
      prisma.stop.aggregate({
        where: stopWhereClause,
        _max: { appointmentDate: true },
      }),
    ]);

    const lastVisitDate = aggregate._max.appointmentDate?.toISOString() ?? null;

    return { visitCount, lastVisitDate };
  },
});
