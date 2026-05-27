import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import Decimal from 'decimal.js';
import type { DashboardQueryPort } from '../types/dashboardTypes';
import {
  LOAD_FINANCIALS_SNAPSHOT_SELECT,
  computeLoadFinancials,
  sumAccessorials,
} from '@/loads/services/derivedFinancials';

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
    // US-11b: replace _sum: { dispatchFee } aggregate with findMany +
    // per-row computeLoadFinancials + JS sum. Org × date range is bounded
    // (~50-500 typical rows).
    const loads = await prisma.load.findMany({
      where: {
        organizationId,
        status: { in: ['DELIVERED', 'INVOICE_PENDING', 'INVOICED', 'PAID'] },
        updatedAt: { gte: dateFrom, lte: dateTo },
        deletedAt: null,
      },
      select: {
        ...LOAD_FINANCIALS_SNAPSHOT_SELECT,
        accessorialCharges: { select: { amount: true } },
      },
    });
    return loads.reduce((sum, load) => {
      if (load.customerRate === null) return sum;
      const f = computeLoadFinancials(load, sumAccessorials(load.accessorialCharges));
      return sum.plus(new Decimal(f.dispatchFee));
    }, new Decimal(0));
  },

  sumPartnerSplitInDateRange: async (organizationId, dateFrom, dateTo) => {
    // US-11b: replace _sum: { partnerSplit } aggregate with findMany +
    // per-row computeLoadFinancials + JS sum.
    const loads = await prisma.load.findMany({
      where: {
        organizationId,
        status: { in: ['DELIVERED', 'INVOICE_PENDING', 'INVOICED', 'PAID'] },
        updatedAt: { gte: dateFrom, lte: dateTo },
        deletedAt: null,
      },
      select: {
        ...LOAD_FINANCIALS_SNAPSHOT_SELECT,
        accessorialCharges: { select: { amount: true } },
      },
    });
    return loads.reduce((sum, load) => {
      if (load.customerRate === null) return sum;
      const f = computeLoadFinancials(load, sumAccessorials(load.accessorialCharges));
      return sum.plus(new Decimal(f.partnerSplit));
    }, new Decimal(0));
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

    // Insurance state lives on Document rows (type=INSURANCE_CERT) now that
    // the cached Carrier.insuranceExpiry column has been retired. Document
    // is associated to Carrier via the (entityType='carrier', entityId)
    // polymorphic shape — there is no direct FK — so we query in two steps.
    const activeCarriers = await prisma.carrier.findMany({
      where: {
        managedByOrgId: organizationId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { id: true, name: true },
    });
    if (activeCarriers.length === 0) {
      return [];
    }

    const carriersById = new Map(activeCarriers.map((c) => [c.id, c]));
    const documents = await prisma.document.findMany({
      where: {
        organizationId,
        type: 'INSURANCE_CERT',
        isArchived: false,
        uploadStatus: 'confirmed',
        expiresAt: { lte: cutoff, not: null },
        entityType: 'carrier',
        entityId: { in: Array.from(carriersById.keys()) },
      },
      select: { entityId: true, expiresAt: true },
      orderBy: { expiresAt: 'asc' },
    });

    // Dedupe by carrierId — orderBy `expiresAt ASC` guarantees the first row
    // per carrier is the soonest-to-expire confirmed cert.
    const byCarrier = new Map<string, { id: string; name: string; insuranceExpiry: Date }>();
    for (const doc of documents) {
      if (doc.expiresAt === null) {
        continue;
      }
      const carrier = carriersById.get(doc.entityId);
      if (carrier === undefined || byCarrier.has(carrier.id)) {
        continue;
      }
      byCarrier.set(carrier.id, {
        id: carrier.id,
        name: carrier.name,
        insuranceExpiry: doc.expiresAt,
      });
    }
    return Array.from(byCarrier.values());
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
