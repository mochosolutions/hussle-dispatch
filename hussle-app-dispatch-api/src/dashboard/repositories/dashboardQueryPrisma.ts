import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import Decimal from 'decimal.js';
import type { DashboardQueryPort } from '../types/dashboardTypes';

export const dashboardQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): DashboardQueryPort => ({
  countLoadsByStatus: async (organizationId, statuses) =>
    prisma.load.count({
      where: {
        organizationId,
        status: { in: statuses as never[] },
        deletedAt: null,
      },
    }),

  sumRevenueInDateRange: async (organizationId, dateFrom, dateTo) => {
    const result = await prisma.load.aggregate({
      where: {
        organizationId,
        status: { in: ['DELIVERED', 'INVOICE_PENDING', 'INVOICED', 'PAID'] },
        updatedAt: { gte: dateFrom, lte: dateTo },
        deletedAt: null,
      },
      _sum: { customerRate: true },
    });
    const sum = result._sum.customerRate;
    return sum !== null && sum !== undefined
      ? new Decimal(sum.toString())
      : new Decimal(0);
  },

  sumDispatchFeesInDateRange: async (organizationId, dateFrom, dateTo) => {
    const result = await prisma.load.aggregate({
      where: {
        organizationId,
        status: { in: ['DELIVERED', 'INVOICE_PENDING', 'INVOICED', 'PAID'] },
        updatedAt: { gte: dateFrom, lte: dateTo },
        deletedAt: null,
      },
      _sum: { dispatchFee: true },
    });
    const sum = result._sum.dispatchFee;
    return sum !== null && sum !== undefined
      ? new Decimal(sum.toString())
      : new Decimal(0);
  },

  sumPartnerSplitInDateRange: async (organizationId, dateFrom, dateTo) => {
    const result = await prisma.load.aggregate({
      where: {
        organizationId,
        status: { in: ['DELIVERED', 'INVOICE_PENDING', 'INVOICED', 'PAID'] },
        updatedAt: { gte: dateFrom, lte: dateTo },
        deletedAt: null,
      },
      _sum: { partnerSplit: true },
    });
    const sum = result._sum.partnerSplit;
    return sum !== null && sum !== undefined
      ? new Decimal(sum.toString())
      : new Decimal(0);
  },

  countOverdueInvoices: async (organizationId) =>
    prisma.invoice.count({
      where: {
        load: { organizationId },
        dueDate: { lt: new Date() },
        status: { in: ['SENT', 'APPROVED'] },
      },
    }),

  sumOverdueInvoices: async (organizationId) => {
    const result = await prisma.invoice.aggregate({
      where: {
        load: { organizationId },
        dueDate: { lt: new Date() },
        status: { in: ['SENT', 'APPROVED'] },
      },
      _sum: { totalAmount: true },
    });
    const sum = result._sum.totalAmount;
    return sum !== null && sum !== undefined
      ? new Decimal(sum.toString())
      : new Decimal(0);
  },

  getLoadsInException: async (organizationId) =>
    prisma.load.findMany({
      where: {
        organizationId,
        status: 'EXCEPTION',
        deletedAt: null,
      },
      select: { id: true, loadNumber: true },
    }),

  getOverdueInvoices: async (organizationId) =>
    prisma.invoice.findMany({
      where: {
        load: { organizationId },
        dueDate: { lt: new Date() },
        status: { in: ['SENT', 'APPROVED'] },
      },
      select: { id: true, invoiceNumber: true, dueDate: true },
    }),

  getLoadsWithoutRateCon: async (organizationId) =>
    prisma.load.findMany({
      where: {
        organizationId,
        rateConReceivedAt: null,
        status: { in: ['BOOKED', 'DISPATCHED'] },
        deletedAt: null,
      },
      select: { id: true, loadNumber: true },
    }),

  getInvoicesMissingBol: async (organizationId) =>
    prisma.invoice.findMany({
      where: {
        load: { organizationId },
        missingSignedBol: true,
        status: { in: ['DRAFT', 'APPROVED'] },
      },
      select: { id: true, invoiceNumber: true },
    }),

  getCarriersWithExpiringInsurance: async (organizationId, withinDays) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + withinDays);

    return prisma.carrier.findMany({
      where: {
        managedByOrgId: organizationId,
        insuranceExpiry: { lte: cutoff },
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { id: true, name: true, insuranceExpiry: true },
    }) as Promise<{ id: string; name: string; insuranceExpiry: Date }[]>;
  },

  getBookedLoadsWithPickupToday: async (organizationId, today) => {
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.load.findMany({
      where: {
        organizationId,
        status: 'BOOKED',
        deletedAt: null,
        stops: {
          some: {
            type: 'PICKUP',
            appointmentStart: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      },
      select: { id: true, loadNumber: true },
    });
  },
});
