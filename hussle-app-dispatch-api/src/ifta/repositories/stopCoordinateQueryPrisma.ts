import type { PrismaClient } from '@prisma/client';
import type { StopCoordinateQueryPort } from '../types/iftaTypes';

export const stopCoordinateQueryPrisma = (
  prisma: PrismaClient,
): StopCoordinateQueryPort => ({
  findStopsWithCoordinates: async (loadId, organizationId) => {
    const stops = await prisma.stop.findMany({
      where: {
        loadId,
        load: { organizationId },
      },
      include: {
        place: {
          select: { latitude: true, longitude: true },
        },
      },
      orderBy: { sequence: 'asc' },
    });

    return stops.map((stop) => ({
      id: stop.id,
      sequence: stop.sequence,
      latitude: stop.place?.latitude ? Number(stop.place.latitude) : null,
      longitude: stop.place?.longitude ? Number(stop.place.longitude) : null,
    }));
  },
});
