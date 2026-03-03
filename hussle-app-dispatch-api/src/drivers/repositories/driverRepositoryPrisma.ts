import type { Prisma, PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  CarrierRepositoryPort,
  DriverQueryInput,
  DriverRepositoryPort,
  ListDriversRepositoryInput,
  LoadRepositoryPort,
  NoGoZoneInput,
  PreferredLaneInput,
} from '../types/driverTypes';

type DriverPersistence = DriverRepositoryPort & CarrierRepositoryPort & LoadRepositoryPort;

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

const toNoGoZonesJson = (noGoZones: NoGoZoneInput[] | undefined): Prisma.InputJsonValue | undefined => {
  if (noGoZones === undefined) {
    return undefined;
  }

  return noGoZones.map((zone) => ({
    state: zone.state,
    city: zone.city ?? null,
  }));
};

const buildCreateData = (
  input: Parameters<DriverRepositoryPort['create']>[0],
): Prisma.DriverUncheckedCreateInput => ({
  ...input,
  preferredLanes: toPreferredLanesJson(input.preferredLanes),
  noGoZones: toNoGoZonesJson(input.noGoZones),
});

const buildUpdateData = (
  input: Parameters<DriverRepositoryPort['update']>[1],
): Prisma.DriverUncheckedUpdateInput => ({
  ...input,
  preferredLanes: toPreferredLanesJson(input.preferredLanes),
  noGoZones: toNoGoZonesJson(input.noGoZones),
});

const buildListWhere = (
  organizationId: string,
  filters: DriverQueryInput['filters'],
): Prisma.DriverWhereInput => {
  const where: Prisma.DriverWhereInput = {
    deletedAt: null,
    carrier: {
      managedByOrgId: organizationId,
      deletedAt: null,
    },
  };

  if (filters.carrierId !== undefined) {
    where.carrierId = filters.carrierId;
  }

  if (filters.search !== undefined && filters.search.length > 0) {
    where.OR = [
      {
        name: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
};

export const driverRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): DriverPersistence => ({
  create: (input) =>
    prisma.driver.create({
      data: buildCreateData(input),
    }),

  findById: (id, organizationId) =>
    prisma.driver.findFirst({
      where: {
        id,
        deletedAt: null,
        carrier: {
          managedByOrgId: organizationId,
          deletedAt: null,
        },
      },
    }),

  list: ({ organizationId, filters, skip, take, orderBy }: ListDriversRepositoryInput) =>
    prisma.driver.findMany({
      where: buildListWhere(organizationId, filters),
      skip,
      take,
      orderBy,
    }),

  count: ({ organizationId, filters }: DriverQueryInput) =>
    prisma.driver.count({
      where: buildListWhere(organizationId, filters),
    }),

  update: (id, input) =>
    prisma.driver.update({
      where: {
        id,
      },
      data: buildUpdateData(input),
    }),

  softDelete: async (id, deletedAt) => {
    await prisma.driver.update({
      where: {
        id,
      },
      data: {
        deletedAt,
      },
    });
  },

  findActiveByIdForOrg: async (carrierId, organizationId) => {
    const carrier = await prisma.carrier.findFirst({
      where: {
        id: carrierId,
        managedByOrgId: organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    return carrier !== null;
  },

  findBlockingLoadIdsByDriver: async (driverId, statuses, limit) => {
    const loads = await prisma.load.findMany({
      where: {
        driverId,
        deletedAt: null,
        status: {
          in: statuses,
        },
      },
      select: {
        id: true,
      },
      take: limit,
    });

    return loads.map((load) => load.id);
  },
});
