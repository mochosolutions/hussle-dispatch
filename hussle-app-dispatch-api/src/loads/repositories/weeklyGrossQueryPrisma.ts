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
      },
    }),

  getWeeklyRevenue: async (
    vehicleId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<Decimal> => {
    const result = await prisma.load.aggregate({
      where: {
        vehicleId,
        status: { in: [...REVENUE_STATUSES] },
        updatedAt: {
          gte: weekStart,
          lte: weekEnd,
        },
        deletedAt: null,
      },
      _sum: {
        customerRate: true,
      },
    });

    const sum = result._sum.customerRate;

    if (sum === null || sum === undefined) {
      return new Decimal(0);
    }

    return new Decimal(sum.toString());
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
