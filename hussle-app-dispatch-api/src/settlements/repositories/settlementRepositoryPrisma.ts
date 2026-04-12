import type { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import type {
  ListSettlementsInput,
  SettlementRepoPort,
} from '../types/settlementTypes';

const SETTLEMENT_DETAIL_INCLUDE = {
  lineItems: true,
  carrier: true,
  driver: true,
  vehicle: true,
} as const;

const SETTLEMENT_LIST_SELECT = {
  id: true,
  settlementNumber: true,
  status: true,
  periodStart: true,
  periodEnd: true,
  grossRevenue: true,
  dispatchFeeTotal: true,
  expensesTotal: true,
  netEarnings: true,
  totalMiles: true,
  createdAt: true,
  carrier: {
    select: {
      id: true,
      name: true,
    },
  },
  driver: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

const buildListWhere = (filters: Omit<ListSettlementsInput, 'skip' | 'take'>) => {
  const where: Record<string, unknown> = {
    organizationId: filters.organizationId,
  };

  if (filters.status !== undefined) {
    where['status'] = filters.status;
  }

  if (filters.carrierId !== undefined) {
    where['carrierId'] = filters.carrierId;
  }

  if (filters.driverId !== undefined) {
    where['driverId'] = filters.driverId;
  }

  if (filters.periodStart !== undefined && filters.periodEnd !== undefined) {
    where['periodStart'] = { lte: filters.periodEnd };
    where['periodEnd'] = { gte: filters.periodStart };
  }

  return where;
};

export const settlementRepositoryPrisma = (prisma: PrismaClient): SettlementRepoPort => ({
  create: async (data) => {
    const { lineItems, ...settlementData } = data;

    return prisma.settlement.create({
      data: {
        ...settlementData,
        lineItems: {
          create: lineItems,
        },
      },
      include: SETTLEMENT_DETAIL_INCLUDE,
    });
  },

  findById: async (id, organizationId) =>
    prisma.settlement.findFirst({
      where: { id, organizationId },
      include: SETTLEMENT_DETAIL_INCLUDE,
    }),

  findMany: async (filters) =>
    prisma.settlement.findMany({
      where: buildListWhere(filters),
      select: SETTLEMENT_LIST_SELECT,
      orderBy: { periodEnd: 'desc' },
      skip: filters.skip,
      take: filters.take,
    }),

  count: async (filters) =>
    prisma.settlement.count({
      where: buildListWhere(filters),
    }),

  update: async (id, organizationId, data) => {
    await prisma.settlement.updateMany({
      where: { id, organizationId },
      data,
    });

    const updated = await prisma.settlement.findFirst({
      where: { id, organizationId },
      include: SETTLEMENT_DETAIL_INCLUDE,
    });

    if (!updated) {
      throw new Error(`Settlement ${id} not found after update`);
    }

    return updated;
  },

  addLineItem: async (data) =>
    prisma.settlementLineItem.create({ data }),

  updateLineItem: async (lineItemId, data) =>
    prisma.settlementLineItem.update({
      where: { id: lineItemId },
      data,
    }),

  deleteLineItem: async (lineItemId) => {
    await prisma.settlementLineItem.delete({ where: { id: lineItemId } });
  },

  findOverlapping: async (organizationId, carrierId, driverId, periodStart, periodEnd) =>
    prisma.settlement.findFirst({
      where: {
        organizationId,
        carrierId,
        driverId: driverId ?? null,
        periodStart: { lt: periodEnd },
        periodEnd: { gt: periodStart },
      },
    }),

  recalculateTotals: async (settlementId) => {
    const lineItems = await prisma.settlementLineItem.findMany({
      where: { settlementId },
    });

    let grossRevenue = new Decimal(0);
    let dispatchFeeTotal = new Decimal(0);
    let accessorialsTotal = new Decimal(0);
    let expensesTotal = new Decimal(0);
    let adjustmentsTotal = new Decimal(0);
    let totalMiles = 0;

    lineItems.forEach((item) => {
      const amount = new Decimal(item.amount.toString());

      switch (item.type) {
        case 'LOAD_REVENUE':
          grossRevenue = grossRevenue.plus(amount);
          if (item.miles !== null) {
            totalMiles += item.miles;
          }
          break;
        case 'DISPATCH_FEE':
          dispatchFeeTotal = dispatchFeeTotal.plus(amount);
          break;
        case 'ACCESSORIAL':
          accessorialsTotal = accessorialsTotal.plus(amount);
          break;
        case 'EXPENSE':
          expensesTotal = expensesTotal.plus(amount);
          break;
        case 'ADJUSTMENT':
          adjustmentsTotal = adjustmentsTotal.plus(amount);
          break;
        default:
          break;
      }
    });

    const netEarnings = grossRevenue
      .minus(dispatchFeeTotal)
      .plus(accessorialsTotal)
      .minus(expensesTotal)
      .plus(adjustmentsTotal)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN);

    return prisma.settlement.update({
      where: { id: settlementId },
      data: {
        grossRevenue: grossRevenue.toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN).toNumber(),
        dispatchFeeTotal: dispatchFeeTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN).toNumber(),
        expensesTotal: expensesTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN).toNumber(),
        netEarnings: netEarnings.toNumber(),
        totalMiles,
      },
      include: SETTLEMENT_DETAIL_INCLUDE,
    });
  },
});
