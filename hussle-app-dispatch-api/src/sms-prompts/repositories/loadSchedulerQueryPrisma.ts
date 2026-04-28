import type { PrismaClient } from '@prisma/client';
import type {
  LoadForScheduling,
  LoadSchedulerQueryPort,
} from '../types/loadSchedulerQueryPort';

export const loadSchedulerQueryPrisma = (
  prisma: PrismaClient,
): LoadSchedulerQueryPort => ({
  findForScheduling: async (loadId) => {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: {
        id: true,
        loadNumber: true,
        organizationId: true,
        driverId: true,
        status: true,
        equipmentType: true,
        stops: {
          orderBy: { sequence: 'asc' },
          select: {
            sequence: true,
            appointmentStart: true,
            appointmentEnd: true,
            departureTime: true,
            type: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (load === null) {
      return null;
    }

    const result: LoadForScheduling = {
      id: load.id,
      loadNumber: load.loadNumber,
      organizationId: load.organizationId,
      driverId: load.driverId,
      status: load.status,
      equipmentType: load.equipmentType,
      stops: load.stops.map((stop) => ({
        sequence: stop.sequence,
        appointmentStart: stop.appointmentStart,
        appointmentEnd: stop.appointmentEnd,
        departureTime: stop.departureTime,
        type: stop.type,
        city: stop.city,
        state: stop.state,
      })),
    };

    return result;
  },
});
