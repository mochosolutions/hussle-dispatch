import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import Decimal from 'decimal.js';
import type { WeeklyGrossQueryPort } from '../types/weeklyGrossTypes';

const REVENUE_STATUSES = ['DELIVERED', 'INVOICE_PENDING', 'INVOICED', 'PAID'] as const;

export const weeklyGrossQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): WeeklyGrossQueryPort => ({
  getActiveVehiclesWithCarrier: async (organizationId: string) =>
    prisma.vehicle.findMany({
      where: {
        carrier: { managedByOrgId: organizationId },
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        unitNumber: true,
        carrier: { select: { name: true } },
        driver: { select: { firstName: true, lastName: true } },
      },
    }),

  getWeeklyRevenue: async (
    vehicleId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<{ revenue: Decimal; loadCount: number }> => {
    const whereClause = {
      vehicleId,
      status: { in: [...REVENUE_STATUSES] },
      updatedAt: {
        gte: weekStart,
        lte: weekEnd,
      },
      deletedAt: null,
    };

    const [aggregateResult, loadCount] = await Promise.all([
      prisma.load.aggregate({
        where: whereClause,
        _sum: { customerRate: true },
      }),
      prisma.load.count({ where: whereClause }),
    ]);

    const sum = aggregateResult._sum.customerRate;
    const revenue = sum === null || sum === undefined
      ? new Decimal(0)
      : new Decimal(sum.toString());

    return { revenue, loadCount };
  },

  getWeeklyGrossTarget: async (organizationId: string): Promise<Decimal> => {
    const settings = await prisma.orgSettings.findUnique({
      where: { organizationId },
      select: { weeklyGrossTarget: true },
    });

    if (settings === null) {
      return new Decimal(5000);
    }

    return new Decimal(settings.weeklyGrossTarget.toString());
  },
});
