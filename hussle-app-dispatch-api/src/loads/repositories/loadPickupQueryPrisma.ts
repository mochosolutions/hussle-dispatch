import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { LoadPickupQueryPort } from '../types/rankDriverTypes';

export const loadPickupQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): LoadPickupQueryPort => ({
  getFirstPickup: async (loadId) => {
    const stop = await prisma.stop.findFirst({
      where: {
        loadId,
        type: 'PICKUP',
      },
      orderBy: { sequence: 'asc' },
      include: {
        place: {
          select: {
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (stop === null) {
      return null;
    }

    return {
      placeId: stop.placeId,
      lat: stop.place?.latitude !== null && stop.place?.latitude !== undefined
        ? Number(stop.place.latitude)
        : null,
      lng: stop.place?.longitude !== null && stop.place?.longitude !== undefined
        ? Number(stop.place.longitude)
        : null,
      appointmentStart: stop.appointmentStart,
      appointmentEnd: stop.appointmentEnd,
      schedulingType: stop.schedulingType,
    };
  },
});
