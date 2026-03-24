import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  CreatePlaceInput,
  FindLoadsAtFacilityInput,
  ListPlacesRepositoryInput,
  PlaceQueryInput,
  PlaceRepositoryPort,
  TypeaheadPlaceInput,
  UpdatePlaceInput,
} from '../types/placeTypes';

const buildListWhere = (
  organizationId: string,
  filters: PlaceQueryInput['filters'],
) => {
  const where: {
    organizationId: string;
    deletedAt: null;
    facilityType?: PlaceQueryInput['filters']['facilityType'];
    state?: string;
    contactId?: string;
    customerId?: string;
    OR?: {
      name?: { contains: string; mode: 'insensitive' };
      city?: { contains: string; mode: 'insensitive' };
      state?: { contains: string; mode: 'insensitive' };
    }[];
  } = {
    organizationId,
    deletedAt: null,
  };

  if (filters.facilityType !== undefined) {
    where.facilityType = filters.facilityType;
  }

  if (filters.state !== undefined && filters.state.length > 0) {
    where.state = filters.state;
  }

  if (filters.contactId !== undefined && filters.contactId.length > 0) {
    where.contactId = filters.contactId;
  }

  if (filters.customerId !== undefined && filters.customerId.length > 0) {
    where.customerId = filters.customerId;
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
        city: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        state: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
};

export const placeRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): PlaceRepositoryPort => ({
  create: (organizationId: string, input: CreatePlaceInput) =>
    prisma.place.create({
      data: {
        organizationId,
        ...input,
      },
    }),

  findById: (id: string, organizationId: string) =>
    prisma.place.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    }),

  list: ({ organizationId, filters, skip, take, orderBy }: ListPlacesRepositoryInput) =>
    prisma.place.findMany({
      where: buildListWhere(organizationId, filters),
      skip,
      take,
      orderBy,
    }),

  count: ({ organizationId, filters }: PlaceQueryInput) =>
    prisma.place.count({
      where: buildListWhere(organizationId, filters),
    }),

  update: (id: string, input: UpdatePlaceInput) =>
    prisma.place.update({
      where: { id },
      data: { ...input },
    }),

  softDelete: async (id: string, deletedAt: Date) => {
    await prisma.place.update({
      where: { id },
      data: { deletedAt },
    });
  },

  typeahead: async ({ organizationId, query, limit }: TypeaheadPlaceInput) => {
    if (query.length < 2) {
      return [];
    }

    const clampedLimit = Math.min(limit, 20);

    const results = await prisma.place.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { state: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        facilityType: true,
        contactName: true,
        contactPhone: true,
        latitude: true,
        longitude: true,
      },
      take: clampedLimit,
    });

    return results.map((r) => ({
      ...r,
      latitude: r.latitude !== null ? r.latitude.toNumber() : null,
      longitude: r.longitude !== null ? r.longitude.toNumber() : null,
    }));
  },

  findLoadsAtFacility: async ({
    placeId,
    skip,
    take,
    orderBy,
  }: FindLoadsAtFacilityInput) => {
    const where = {
      deletedAt: null,
      stops: { some: { placeId } },
    };

    const [data, total] = await Promise.all([
      prisma.load.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      prisma.load.count({ where }),
    ]);

    return { data, total };
  },
});
