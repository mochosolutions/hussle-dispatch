import type { PrismaClient, Driver, Prisma } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  CarrierNoteInput,
  CarrierNoteRepositoryPort,
  CarrierQueryInput,
  CarrierRepositoryPort,
  CarrierWithCounts,
  CarrierWithAssets,
  CreateCarrierInput,
  ListCarriersRepositoryInput,
  LoadRepositoryPort,
  UpdateCarrierInput,
} from '../types/carrierTypes';
import type { LoadStatus } from '@prisma/client';
import type {
  CreateDriverInput,
  NoGoZoneInput,
  PreferredLaneInput,
} from '@/drivers/types/driverTypes';
import type { CreateVehicleInput } from '@/vehicles/types/vehicleTypes';
import type { VehicleWithExpenses } from '@/vehicles/types/vehicleTypes';

const toPreferredLanesJson = (
  preferredLanes: PreferredLaneInput[] | undefined,
): Prisma.InputJsonValue | undefined => {
  if (preferredLanes === undefined) {
    return undefined;
  }

  return preferredLanes.map((lane) => ({
    originState: lane.originState,
    destState: lane.destState,
    originCity: lane.originCity ?? null,
    destCity: lane.destCity ?? null,
  }));
};

const toNoGoZonesJson = (
  noGoZones: NoGoZoneInput[] | undefined,
): Prisma.InputJsonValue | undefined => {
  if (noGoZones === undefined) {
    return undefined;
  }

  return noGoZones.map((zone) => ({
    state: zone.state,
    city: zone.city ?? null,
  }));
};

const selectWithCounts = {
  _count: {
    select: {
      drivers: {
        where: {
          deletedAt: null,
        },
      },
      vehicles: {
        where: {
          deletedAt: null,
        },
      },
    },
  },
  primaryContact: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
    },
  },
} as const;

const buildListWhere = (
  organizationId: string,
  filters: ListCarriersRepositoryInput['filters'],
) => {
  const where: {
    managedByOrgId: string;
    deletedAt: null;
    type?: ListCarriersRepositoryInput['filters']['type'];
    OR?: {
      name?: { contains: string; mode: 'insensitive' };
      mcNumber?: { contains: string; mode: 'insensitive' };
    }[];
  } = {
    managedByOrgId: organizationId,
    deletedAt: null,
  };

  if (filters.type !== undefined) {
    where.type = filters.type;
  }

  if (filters.search !== undefined && filters.search.length > 0) {
    where.OR = [
      {
        name: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        mcNumber: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
};

type CarrierPersistence = CarrierRepositoryPort & LoadRepositoryPort & CarrierNoteRepositoryPort;

export const carrierRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): CarrierPersistence => ({
  create: (organizationId: string, input: CreateCarrierInput): Promise<CarrierWithCounts> =>
    prisma.carrier.create({
      data: {
        managedByOrgId: organizationId,
        ...input,
      } as Prisma.CarrierUncheckedCreateInput,
      include: selectWithCounts,
    }),

  createWithAssets: async (
    organizationId: string,
    payload: {
      carrier: CreateCarrierInput;
      drivers?: Omit<CreateDriverInput, 'carrierId'>[];
      vehicles?: Omit<CreateVehicleInput, 'carrierId'>[];
    },
  ): Promise<CarrierWithAssets> => {
    const executeCreateWithAssets = async (
      tx: PrismaClient | PrismaTransaction,
    ): Promise<CarrierWithAssets> => {
      // Create carrier
      const newCarrier = await tx.carrier.create({
        data: {
          managedByOrgId: organizationId,
          ...payload.carrier,
        } as Prisma.CarrierUncheckedCreateInput,
        include: selectWithCounts,
      });

      // Create drivers if provided
      let createdDrivers: Driver[] = [];
      if (payload.drivers?.length) {
        for (const driver of payload.drivers) {
          await tx.driver.create({
            data: {
              ...driver,
              carrierId: newCarrier.id,
              preferredLanes: toPreferredLanesJson(driver.preferredLanes),
              noGoZones: toNoGoZonesJson(driver.noGoZones),
            },
          });
        }
        createdDrivers = await tx.driver.findMany({
          where: { carrierId: newCarrier.id, deletedAt: null },
          orderBy: { createdAt: 'asc' },
        });
      }

      // Create vehicles if provided
      let createdVehicles: VehicleWithExpenses[] = [];
      if (payload.vehicles?.length) {
        createdVehicles = await Promise.all(
          payload.vehicles.map((vehicle) =>
            tx.vehicle.create({
              data: {
                ...vehicle,
                carrierId: newCarrier.id,
              },
              include: {
                expenses: true,
              },
            }),
          ),
        );
      }

      return {
        ...newCarrier,
        drivers: createdDrivers,
        vehicles: createdVehicles,
      };
    };

    // Check if prisma is a PrismaClient (has $transaction method)
    if ('$transaction' in prisma && typeof prisma.$transaction === 'function') {
      return prisma.$transaction(async (tx) => executeCreateWithAssets(tx));
    }

    // If it's already a transaction, just execute directly
    return executeCreateWithAssets(prisma);
  },

  findById: (id: string, organizationId: string): Promise<CarrierWithCounts | null> =>
    prisma.carrier.findFirst({
      where: {
        id,
        managedByOrgId: organizationId,
        deletedAt: null,
      },
      include: selectWithCounts,
    }),

  list: ({ organizationId, filters, skip, take, orderBy }: ListCarriersRepositoryInput) =>
    prisma.carrier.findMany({
      where: buildListWhere(organizationId, filters),
      skip,
      take,
      orderBy,
      include: selectWithCounts,
    }),

  count: ({ organizationId, filters }: CarrierQueryInput): Promise<number> =>
    prisma.carrier.count({
      where: buildListWhere(organizationId, filters),
    }),

  update: (id: string, input: UpdateCarrierInput): Promise<CarrierWithCounts> =>
    prisma.carrier.update({
      where: {
        id,
      },
      data: {
        ...input,
      } as Prisma.CarrierUncheckedUpdateInput,
      include: selectWithCounts,
    }),

  softDelete: async (id: string, deletedAt: Date): Promise<void> => {
    await prisma.carrier.update({
      where: {
        id,
      },
      data: {
        deletedAt,
      },
    });
  },

  findBlockingLoadIds: async (
    carrierId: string,
    statuses: readonly LoadStatus[],
    limit: number,
  ): Promise<string[]> => {
    const loads = await prisma.load.findMany({
      where: {
        carrierId,
        deletedAt: null,
        status: {
          in: [...statuses],
        },
      },
      select: {
        id: true,
      },
      take: limit,
    });

    return loads.map((load) => load.id);
  },

  createNote: (carrierId: string, input: CarrierNoteInput) =>
    prisma.carrierNote.create({
      data: {
        carrierId,
        text: input.text,
        authorId: input.authorId,
        authorName: input.authorName,
      },
    }),

  listNotes: (carrierId: string, skip: number, take: number) =>
    prisma.carrierNote.findMany({
      where: { carrierId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),

  countNotes: (carrierId: string) =>
    prisma.carrierNote.count({
      where: { carrierId },
    }),
});
