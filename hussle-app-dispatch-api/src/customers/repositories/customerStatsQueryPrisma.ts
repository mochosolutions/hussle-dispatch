import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import Decimal from 'decimal.js';

export interface CustomerStatsResult {
  totalRevenue: string;
  avgDaysToPay: number | null;
  outstandingAR: string;
  loadCount: number;
}

export interface CustomerStatsQueryPort {
  getStats: (customerId: string, organizationId: string) => Promise<CustomerStatsResult>;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const computeAvgDaysToPay = (
  invoices: Array<{ sentAt: Date | null; paidAt: Date | null }>,
): number | null => {
  if (invoices.length === 0) {
    return null;
  }

  const totalDays = invoices.reduce((sum, invoice) => {
    const sentAt = invoice.sentAt;
    const paidAt = invoice.paidAt;

    if (sentAt === null || paidAt === null) {
      return sum;
    }

    return sum + (paidAt.getTime() - sentAt.getTime()) / MS_PER_DAY;
  }, 0);

  const avg = totalDays / invoices.length;

  return Math.round(avg * 10) / 10;
};

export const customerStatsQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): CustomerStatsQueryPort => ({
  getStats: async (customerId, organizationId) => {
    const loadWhereClause = { customerId, organizationId, deletedAt: null };

    const [loadCount, revenueAggregate, arAggregate, paidInvoices] = await Promise.all([
      prisma.load.count({ where: loadWhereClause }),
      prisma.load.aggregate({
        where: loadWhereClause,
        _sum: { customerRate: true },
      }),
      prisma.invoice.aggregate({
        where: {
          customerId,
          status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.findMany({
        where: {
          customerId,
          status: 'PAID',
          paidAt: { not: null },
          sentAt: { not: null },
        },
        select: { sentAt: true, paidAt: true },
      }),
    ]);

    const revenueSum = revenueAggregate._sum.customerRate;
    const totalRevenue =
      revenueSum !== null && revenueSum !== undefined
        ? new Decimal(revenueSum.toString()).toFixed(2)
        : '0.00';

    const arSum = arAggregate._sum.totalAmount;
    const outstandingAR =
      arSum !== null && arSum !== undefined
        ? new Decimal(arSum.toString()).toFixed(2)
        : '0.00';

    const avgDaysToPay = computeAvgDaysToPay(paidInvoices);

    return { totalRevenue, avgDaysToPay, outstandingAR, loadCount };
  },
});
