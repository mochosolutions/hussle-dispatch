import { CarrierStatus, type PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import Decimal from 'decimal.js';

export interface CarrierStatsResult {
  lifetimeRevenue: string;
  loadCount: number;
}

export interface CarrierTabCounts {
  all: number;
  onboarding: number;
  active: number;
  actionRequired: number;
  suspended: number;
  rejected: number;
}

export interface CarrierStatsQueryPort {
  getStats: (carrierId: string, organizationId: string) => Promise<CarrierStatsResult>;
  getTabCounts: (organizationId: string) => Promise<CarrierTabCounts>;
}

const ONBOARDING_STATUSES: CarrierStatus[] = [
  CarrierStatus.DRAFT,
  CarrierStatus.INVITED,
  CarrierStatus.ONBOARDING,
  CarrierStatus.PENDING_APPROVAL,
];

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

  getTabCounts: async (organizationId) => {
    const baseWhere = { managedByOrgId: organizationId, deletedAt: null };

    const grouped = await prisma.carrier.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: { _all: true },
    });

    const byStatus = new Map<CarrierStatus, number>();
    for (const row of grouped) {
      byStatus.set(row.status, row._count._all);
    }
    const get = (status: CarrierStatus) => byStatus.get(status) ?? 0;

    const onboarding = ONBOARDING_STATUSES.reduce((sum, s) => sum + get(s), 0);
    const all = Array.from(byStatus.values()).reduce((sum, n) => sum + n, 0);

    return {
      all,
      onboarding,
      active: get(CarrierStatus.ACTIVE),
      actionRequired: get(CarrierStatus.ACTION_REQUIRED),
      suspended: get(CarrierStatus.SUSPENDED),
      rejected: get(CarrierStatus.REJECTED),
    };
  },
});
