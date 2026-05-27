import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  ContactQueryInput,
  ContactRepositoryPort,
  CreateContactInput,
  ListContactsRepositoryInput,
  UpdateContactInput,
} from '../types/contactTypes';

const buildListWhere = (organizationId: string, filters: ContactQueryInput['filters']) => {
  const where: {
    organizationId: string;
    deletedAt: null;
    customerId?: string;
    OR?: {
      firstName?: { contains: string; mode: 'insensitive' };
      lastName?: { contains: string; mode: 'insensitive' };
      email?: { contains: string; mode: 'insensitive' };
    }[];
  } = {
    organizationId,
    deletedAt: null,
  };

  if (filters.customerId !== undefined) {
    where.customerId = filters.customerId;
  }

  if (filters.search !== undefined && filters.search.length > 0) {
    where.OR = [
      {
        firstName: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        lastName: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
};

const CONTACT_INCLUDE = {
  customer: true,
} as const;

export const contactRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): ContactRepositoryPort => ({
  create: (organizationId, input) =>
    prisma.contact.create({
      data: {
        organizationId,
        ...input,
      },
      include: CONTACT_INCLUDE,
    }),

  findById: (id, organizationId) =>
    prisma.contact.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: CONTACT_INCLUDE,
    }),

  list: ({ organizationId, filters, skip, take, orderBy }: ListContactsRepositoryInput) =>
    prisma.contact.findMany({
      where: buildListWhere(organizationId, filters),
      skip,
      take,
      orderBy,
      include: CONTACT_INCLUDE,
    }),

  count: ({ organizationId, filters }: ContactQueryInput) =>
    prisma.contact.count({
      where: buildListWhere(organizationId, filters),
    }),

  update: (id, input) =>
    prisma.contact.update({
      where: {
        id,
      },
      data: input,
      include: CONTACT_INCLUDE,
    }),

  softDelete: async (id, deletedAt) => {
    await prisma.contact.update({
      where: {
        id,
      },
      data: {
        deletedAt,
      },
    });
  },
});
