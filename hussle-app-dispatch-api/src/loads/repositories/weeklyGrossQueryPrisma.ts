import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import Decimal from 'decimal.js';
import type { WeeklyGrossQueryPort } from '../types/weeklyGrossTypes';
import {
  LOAD_FINANCIALS_SNAPSHOT_SELECT,
  computeLoadFinancials,
  sumAccessorials,
} from '../services/derivedFinancials';

const REVENUE_STATUSES = ['DELIVERED', 'INVOICE_PENDING', 'INVOICED', 'PAID'] as const;

const toDecimal = (value: Decimal | null | undefined): Decimal =>
  value === null || value === undefined ? new Decimal(0) : new Decimal(value.toString());

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
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { carrier: { select: { type: true } } },
    });

    const whereClause = {
      vehicleId,
      status: { in: [...REVENUE_STATUSES] },
      updatedAt: { gte: weekStart, lte: weekEnd },
      deletedAt: null,
    };

    const loadCount = await prisma.load.count({ where: whereClause });

    if (vehicle?.carrier?.type === 'EXTERNAL_CARRIER') {
      // US-11b: replace _sum: { dispatchFee } aggregate with findMany +
      // per-row computeLoadFinancials + JS sum. Scope is one vehicle × one
      // week, so row count is bounded.
      const loads = await prisma.load.findMany({
        where: whereClause,
        select: {
          ...LOAD_FINANCIALS_SNAPSHOT_SELECT,
          accessorialCharges: { select: { amount: true } },
        },
      });
      const revenue = loads.reduce((sum, load) => {
        if (load.customerRate === null) return sum;
        const f = computeLoadFinancials(load, sumAccessorials(load.accessorialCharges));
        return sum.plus(new Decimal(f.dispatchFee));
      }, new Decimal(0));
      return { revenue, loadCount };
    }

    const result = await prisma.load.aggregate({
      where: whereClause,
      _sum: { customerRate: true },
    });
    return { revenue: toDecimal(result._sum.customerRate), loadCount };
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

  findVehicleCarrierType: async (vehicleId, organizationId) => {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        deletedAt: null,
        carrier: { managedByOrgId: organizationId, deletedAt: null },
      },
      select: { carrier: { select: { type: true } } },
    });

    if (vehicle === null || vehicle.carrier === null) {
      return null;
    }

    return { carrierType: vehicle.carrier.type };
  },
});
