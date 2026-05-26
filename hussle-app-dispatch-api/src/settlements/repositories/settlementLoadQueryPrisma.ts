import type { PrismaClient } from '@prisma/client';
import { LOAD_FINANCIALS_SNAPSHOT_SELECT } from '../../loads/services/derivedFinancials';
import type { SettlementLoadQueryPort } from '../types/settlementTypes';

export const settlementLoadQueryPrisma = (prisma: PrismaClient): SettlementLoadQueryPort => ({
  findDeliveredLoads: async (organizationId, carrierId, driverId, periodStart, periodEnd) =>
    prisma.load.findMany({
      where: {
        organizationId,
        carrierId,
        status: 'DELIVERED',
        deletedAt: null,
        ...(driverId !== undefined && { driverId }),
        stops: {
          some: {
            type: 'DELIVERY',
            OR: [
              {
                departureTime: {
                  gte: periodStart,
                  lte: periodEnd,
                },
              },
              {
                appointmentStart: {
                  gte: periodStart,
                  lte: periodEnd,
                },
              },
            ],
          },
        },
      },
      select: {
        id: true,
        loadNumber: true,
        carrierRate: true,
        estimatedHours: true,
        ...LOAD_FINANCIALS_SNAPSHOT_SELECT,
        accessorialCharges: {
          select: {
            id: true,
            type: true,
            description: true,
            amount: true,
            billTo: true,
          },
        },
        stops: {
          where: { type: 'DELIVERY' },
          select: { departureTime: true, appointmentStart: true },
          orderBy: { sequence: 'desc' },
          take: 1,
        },
      },
    }).then((loads) =>
      loads.map((load) => {
        const deliveryStop = load.stops[0];
        const deliveredAt = deliveryStop?.departureTime ?? deliveryStop?.appointmentStart ?? null;

        return {
          id: load.id,
          loadNumber: load.loadNumber,
          carrierRate: load.carrierRate,
          customerRate: load.customerRate,
          dispatchFeeType: load.dispatchFeeType,
          dispatchFeeAmount: load.dispatchFeeAmount,
          totalMiles: load.totalMiles,
          loadedMiles: load.loadedMiles,
          estimatedHours: load.estimatedHours,
          partnerSplitPercent: load.partnerSplitPercent,
          driverPayType: load.driverPayType,
          driverPayRate: load.driverPayRate,
          dispatcherCommissionType: load.dispatcherCommissionType,
          dispatcherCommissionRate: load.dispatcherCommissionRate,
          feeIncludesAccessorials: load.feeIncludesAccessorials,
          payFromNet: load.payFromNet,
          carrierType: load.carrierType,
          deliveredAt,
          accessorialCharges: load.accessorialCharges,
        };
      }),
    ),
});
