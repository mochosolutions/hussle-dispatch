import type { PrismaClient } from '@prisma/client';
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
        customerRate: true,
        carrierPayout: true,
        dispatchFee: true,
        dispatchFeeOverrideType: true,
        dispatchFeeOverrideAmount: true,
        totalMiles: true,
        loadedMiles: true,
        estimatedHours: true,
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
          carrierPayout: load.carrierPayout,
          dispatchFee: load.dispatchFee,
          dispatchFeeOverrideType: load.dispatchFeeOverrideType,
          dispatchFeeOverrideAmount: load.dispatchFeeOverrideAmount,
          totalMiles: load.totalMiles,
          loadedMiles: load.loadedMiles,
          estimatedHours: load.estimatedHours,
          deliveredAt,
          accessorialCharges: load.accessorialCharges,
        };
      }),
    ),
});
