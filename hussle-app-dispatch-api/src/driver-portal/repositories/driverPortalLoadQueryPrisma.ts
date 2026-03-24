import type { PrismaClient } from '@prisma/client';
import type { DriverPortalLoadQueryPort } from '../types/driverPortalTypes';

type PrismaTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export const driverPortalLoadQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): DriverPortalLoadQueryPort => ({
  findDriverPhoneByLoadId: async (loadId) => {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: {
        driver: {
          select: {
            phone: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (load?.driver?.phone === null || load?.driver?.phone === undefined) {
      return null;
    }

    return {
      phone: load.driver.phone,
      driverName: `${load.driver.firstName} ${load.driver.lastName}`,
    };
  },

  findLoadForDriverPortal: async (loadId) => {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      include: {
        stops: {
          orderBy: { sequence: 'asc' },
        },
        driver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (load === null) {
      return null;
    }

    return {
      id: load.id,
      organizationId: load.organizationId,
      loadNumber: load.loadNumber,
      status: load.status,
      equipmentType: load.equipmentType,
      commodity: load.commodity,
      weight: load.weight,
      driverInstructions: load.driverInstructions,
      stops: load.stops.map((stop) => ({
        id: stop.id,
        type: stop.type,
        sequence: stop.sequence,
        facilityName: stop.facilityName,
        address: stop.address,
        city: stop.city,
        state: stop.state,
        zip: stop.zip,
        appointmentDate: stop.appointmentDate,
        appointmentTime: stop.appointmentTime,
        contactName: stop.contactName,
        contactPhone: stop.contactPhone,
        notes: stop.notes,
      })),
      driver: load.driver,
    };
  },
});
