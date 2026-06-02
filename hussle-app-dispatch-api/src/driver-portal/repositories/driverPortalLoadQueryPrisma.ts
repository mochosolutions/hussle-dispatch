import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  DriverPortalLoadQueryPort,
  DriverPortalLoadSummary,
} from '../types/driverPortalTypes';

type PrismaTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

const LOAD_PORTAL_INCLUDE = {
  stops: {
    orderBy: { sequence: 'asc' },
  },
  driver: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
} as const;

type LoadWithPortalRelations = Prisma.LoadGetPayload<{ include: typeof LOAD_PORTAL_INCLUDE }>;

const mapLoadToSummary = (load: LoadWithPortalRelations): DriverPortalLoadSummary => ({
  id: load.id,
  organizationId: load.organizationId,
  driverId: load.driverId,
  loadNumber: load.loadNumber,
  status: load.status,
  equipmentType: load.equipmentType,
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
    appointmentStart: stop.appointmentStart,
    appointmentEnd: stop.appointmentEnd,
    schedulingType: stop.schedulingType,
    contactName: stop.contactName,
    contactPhone: stop.contactPhone,
    commodity: stop.commodity,
    weight: stop.weight,
    pieceCount: stop.pieceCount,
    isHazmat: stop.isHazmat,
    isTarp: stop.isTarp,
    isTempControlled: stop.isTempControlled,
    notes: stop.notes,
  })),
  driver: load.driver,
});

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
      include: LOAD_PORTAL_INCLUDE,
    });

    if (load === null) {
      return null;
    }

    return mapLoadToSummary(load);
  },

  findLoadsByDriver: async (driverId, organizationId) => {
    const loads = await prisma.load.findMany({
      where: { driverId, organizationId, deletedAt: null },
      include: LOAD_PORTAL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return loads.map(mapLoadToSummary);
  },
});
