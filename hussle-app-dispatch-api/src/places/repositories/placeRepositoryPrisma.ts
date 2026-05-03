import type { Place, PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  CreatePlaceInput,
  DedupeKeyParams,
  FindLoadsAtFacilityInput,
  ListPlacesRepositoryInput,
  PlaceQueryInput,
  PlaceRepositoryPort,
  TypeaheadPlaceInput,
  UpdatePlaceInput,
} from '../types/placeTypes';
import { ConflictError } from '@/shared/errors';

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
    source?: string;
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

  if (filters.source !== undefined) {
    where.source = filters.source;
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
): PlaceRepositoryPort => {
  const findByDedupeKey = async (params: DedupeKeyParams): Promise<Place | null> => {
    // Lookup expression must mirror the unique index `Place_dedupeKey_uniq`
    // defined in migration 20260502000000_auto_place_resolution_v1.
    const result = await prisma.$queryRaw<Place[]>`
      SELECT * FROM "Place"
      WHERE "organizationId" = ${params.organizationId}
        AND normalize_dedupe("name") = normalize_dedupe(${params.name})
        AND "awsAddressNumber" IS NOT DISTINCT FROM ${params.awsAddressNumber}
        AND normalize_dedupe("awsStreetBaseName") IS NOT DISTINCT FROM normalize_dedupe(${params.awsStreetBaseName})
        AND "awsStreetType" IS NOT DISTINCT FROM ${params.awsStreetType}
        AND "awsStreetPrefix" IS NOT DISTINCT FROM ${params.awsStreetPrefix}
        AND COALESCE(normalize_dedupe("unit"), '') = COALESCE(normalize_dedupe(${params.unit}), '')
        AND "awsRegion" IS NOT DISTINCT FROM ${params.awsRegion}
        AND "awsPostalCode5" IS NOT DISTINCT FROM ${params.awsPostalCode5}
        AND "deletedAt" IS NULL
      LIMIT 1
    `;
    return result[0] ?? null;
  };

  return {
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

  findByDedupeKey,

  createOnConflictDoNothing: async (
    organizationId: string,
    input: CreatePlaceInput,
    key: DedupeKeyParams,
  ): Promise<Place> => {
    try {
      return await prisma.place.create({
        data: {
          organizationId,
          ...input,
        },
      });
    } catch (error: unknown) {
      // P2002 is Prisma's unique-constraint violation. Fall through to
      // re-read by dedupe key — another writer won the race.
      const isUnique = isPrismaUniqueViolation(error);
      if (!isUnique) {
        throw error;
      }
      const existing = await findByDedupeKey(key);
      if (existing === null) {
        throw new ConflictError(
          'Place dedupe key conflict but row not found by key',
        );
      }
      return existing;
    }
  },

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
        appointmentRequired: true,
        lumperRequired: true,
        ppeRequired: true,
        facilityHours: true,
        is24Hours: true,
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
        include: {
          stops: {
            orderBy: { sequence: 'asc' as const },
          },
        },
      }),
      prisma.load.count({ where }),
    ]);

    return { data, total };
  },
  };
};

const isPrismaUniqueViolation = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const code = (error as { code?: unknown }).code;
  return code === 'P2002';
};
