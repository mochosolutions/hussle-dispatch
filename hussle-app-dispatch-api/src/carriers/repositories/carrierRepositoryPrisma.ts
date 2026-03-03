import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  CarrierQueryInput,
  CarrierRepositoryPort,
  CarrierWithCounts,
  CreateCarrierInput,
  ListCarriersRepositoryInput,
  LoadRepositoryPort,
  UpdateCarrierInput,
} from '../types/carrierTypes';
import type { LoadStatus } from '@prisma/client';

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

type CarrierPersistence = CarrierRepositoryPort & LoadRepositoryPort;

export const carrierRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): CarrierPersistence => ({
  create: (organizationId: string, input: CreateCarrierInput): Promise<CarrierWithCounts> =>
    prisma.carrier.create({
      data: {
        managedByOrgId: organizationId,
        ...input,
      },
      include: selectWithCounts,
    }),

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
      },
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
    statuses: LoadStatus[],
    limit: number,
  ): Promise<string[]> => {
    const loads = await prisma.load.findMany({
      where: {
        carrierId,
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
