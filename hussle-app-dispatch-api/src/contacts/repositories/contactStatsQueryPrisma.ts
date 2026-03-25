import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';

interface RecentLoad {
  id: string;
  loadNumber: string;
  status: string;
  pickupDate: string | null;
}

export interface ContactStatsResult {
  loadCount: number;
  recentLoads: RecentLoad[];
}

export interface ContactStatsQueryPort {
  getStats: (contactId: string, organizationId: string) => Promise<ContactStatsResult>;
}

export const contactStatsQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): ContactStatsQueryPort => ({
  getStats: async (contactId, organizationId) => {
    const whereClause = { contactId, organizationId, deletedAt: null };

    const [loadCount, recentLoads] = await Promise.all([
      prisma.load.count({ where: whereClause }),
      prisma.load.findMany({
        where: whereClause,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          loadNumber: true,
          status: true,
          stops: {
            where: { type: 'PICKUP' },
            take: 1,
            orderBy: { sequence: 'asc' },
            select: { appointmentDate: true },
          },
        },
      }),
    ]);

    const transformedLoads: RecentLoad[] = recentLoads.map((load) => ({
      id: load.id,
      loadNumber: load.loadNumber,
      status: load.status,
      pickupDate: load.stops[0]?.appointmentDate?.toISOString() ?? null,
    }));

    return { loadCount, recentLoads: transformedLoads };
  },
});
