import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import Decimal from 'decimal.js';

export interface CarrierStatsResult {
  lifetimeRevenue: string;
  loadCount: number;
}

export interface CarrierStatsQueryPort {
  getStats: (carrierId: string, organizationId: string) => Promise<CarrierStatsResult>;
}

export const carrierStatsQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): CarrierStatsQueryPort => ({
  getStats: async (carrierId, organizationId) => {
    const whereClause = { carrierId, organizationId, deletedAt: null };

    const [loadCount, aggregate] = await Promise.all([
      prisma.load.count({ where: whereClause }),
      prisma.load.aggregate({
        where: whereClause,
        _sum: { customerRate: true },
      }),
    ]);

    const sum = aggregate._sum.customerRate;
    const lifetimeRevenue =
      sum !== null && sum !== undefined
        ? new Decimal(sum.toString()).toFixed(2)
        : '0.00';

    return { lifetimeRevenue, loadCount };
  },
});
