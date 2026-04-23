import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { PaginationMeta } from '@/shared/responseEnvelope';
import { parsePaginationParams, paginateQuery } from '@/shared/pagination';
import type { ParsedQs } from 'qs';
import Decimal from 'decimal.js';

export interface LoadHistoryItem {
  id: string;
  loadNumber: string;
  status: string;
  customerRate: Decimal | null;
  carrierRate: Decimal | null;
  ratePerMile: Decimal | null;
  totalMiles: number | null;
  loadedMiles: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoadPerformanceMetrics {
  totalLoads: number;
  totalGross: string;
  totalRevenue: string;
  avgRatePerMile: string;
  onTimePercent: string;
}

export interface LoadHistoryResult {
  data: LoadHistoryItem[];
  meta: PaginationMeta;
  metrics: LoadPerformanceMetrics;
}

const loadHistorySelect = {
  id: true,
  loadNumber: true,
  status: true,
  customerRate: true,
  carrierRate: true,
  ratePerMile: true,
  totalMiles: true,
  loadedMiles: true,
  createdAt: true,
  updatedAt: true,
} as const;

const DELIVERED_STATUSES = ['DELIVERED', 'POD_RECEIVED', 'INVOICED', 'PAID'] as const;

export const computeMetrics = (
  allLoads: {
    customerRate: Decimal | null;
    dispatchFee: Decimal | null;
    ratePerMile: Decimal | null;
    status: string;
    carrier: { type: string } | null;
  }[],
): LoadPerformanceMetrics => {
  const totalLoads = allLoads.length;

  let totalGross = new Decimal(0);
  let totalRevenue = new Decimal(0);
  let ratePerMileSum = new Decimal(0);
  let ratePerMileCount = 0;
  let deliveredCount = 0;

  allLoads.forEach((load) => {
    if (load.customerRate !== null) {
      totalGross = totalGross.plus(load.customerRate);
    }

    // LEASED_CARRIER runs on YOUR authority — revenue is the customerRate you bill,
    // same as COMPANY_ASSET. Only EXTERNAL_CARRIER contributes dispatchFee.
    if (
      load.carrier === null ||
      load.carrier.type === 'COMPANY_ASSET' ||
      load.carrier.type === 'LEASED_CARRIER'
    ) {
      if (load.customerRate !== null) {
        totalRevenue = totalRevenue.plus(load.customerRate);
      }
    } else if (load.carrier.type === 'EXTERNAL_CARRIER') {
      if (load.dispatchFee !== null) {
        totalRevenue = totalRevenue.plus(load.dispatchFee);
      }
    }

    if (load.ratePerMile !== null) {
      ratePerMileSum = ratePerMileSum.plus(load.ratePerMile);
      ratePerMileCount += 1;
    }
    if (DELIVERED_STATUSES.includes(load.status as (typeof DELIVERED_STATUSES)[number])) {
      deliveredCount += 1;
    }
  });

  const avgRatePerMile = ratePerMileCount > 0
    ? ratePerMileSum.dividedBy(ratePerMileCount).toFixed(2)
    : '0.00';

  const onTimePercent = totalLoads > 0
    ? new Decimal(deliveredCount).dividedBy(totalLoads).times(100).toFixed(1)
    : '0.0';

  return {
    totalLoads,
    totalGross: totalGross.toFixed(2),
    totalRevenue: totalRevenue.toFixed(2),
    avgRatePerMile,
    onTimePercent,
  };
};

export interface LoadQueryPort {
  getLoadsByDriverId(
    driverId: string,
    query: ParsedQs,
  ): Promise<LoadHistoryResult>;
  getLoadsByVehicleId(
    vehicleId: string,
    query: ParsedQs,
  ): Promise<LoadHistoryResult>;
}

export const createLoadQueries = (
  prisma: PrismaClient | PrismaTransaction,
): LoadQueryPort => ({
  getLoadsByDriverId: async (driverId, query) => {
    const params = parsePaginationParams(query);

    const whereClause = {
      driverId,
      deletedAt: null,
    };

    const paginated = await paginateQuery(
      { ...params, sort: 'createdAt' },
      {
        findMany: ({ skip, take, orderBy }) =>
          prisma.load.findMany({
            where: whereClause,
            select: loadHistorySelect,
            skip,
            take,
            orderBy,
          }),
        count: () =>
          prisma.load.count({ where: whereClause }),
      },
    );

    const allLoadsForMetrics = await prisma.load.findMany({
      where: whereClause,
      select: {
        customerRate: true,
        dispatchFee: true,
        ratePerMile: true,
        status: true,
        carrier: { select: { type: true } },
      },
    });

    const metrics = computeMetrics(allLoadsForMetrics);

    return {
      data: paginated.data,
      meta: paginated.meta,
      metrics,
    };
  },

  getLoadsByVehicleId: async (vehicleId, query) => {
    const params = parsePaginationParams(query);

    const whereClause = {
      vehicleId,
      deletedAt: null,
    };

    const paginated = await paginateQuery(
      { ...params, sort: 'createdAt' },
      {
        findMany: ({ skip, take, orderBy }) =>
          prisma.load.findMany({
            where: whereClause,
            select: loadHistorySelect,
            skip,
            take,
            orderBy,
          }),
        count: () =>
          prisma.load.count({ where: whereClause }),
      },
    );

    const allLoadsForMetrics = await prisma.load.findMany({
      where: whereClause,
      select: {
        customerRate: true,
        dispatchFee: true,
        ratePerMile: true,
        status: true,
        carrier: { select: { type: true } },
      },
    });

    const metrics = computeMetrics(allLoadsForMetrics);

    return {
      data: paginated.data,
      meta: paginated.meta,
      metrics,
    };
  },
});
