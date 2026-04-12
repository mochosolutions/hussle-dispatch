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
        dispatchFee: true,
        totalMiles: true,
        accessorialCharges: {
          select: { id: true, type: true, description: true, amount: true },
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
          dispatchFee: load.dispatchFee,
          totalMiles: load.totalMiles,
          deliveredAt,
          accessorialCharges: load.accessorialCharges,
        };
      }),
    ),
});
