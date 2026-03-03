import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  ContactQueryInput,
  ContactRepositoryPort,
  ListContactsRepositoryInput,
} from '../types/contactTypes';

const buildListWhere = (organizationId: string, filters: ContactQueryInput['filters']) => {
  const where: {
    organizationId: string;
    deletedAt: null;
    type?: ContactQueryInput['filters']['type'];
    OR?: {
      companyName?: { contains: string; mode: 'insensitive' };
      contactName?: { contains: string; mode: 'insensitive' };
    }[];
  } = {
    organizationId,
    deletedAt: null,
  };

  if (filters.type !== undefined) {
    where.type = filters.type;
  }

  if (filters.search !== undefined && filters.search.length > 0) {
    where.OR = [
      {
        companyName: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        contactName: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
};

export const contactRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): ContactRepositoryPort => ({
  create: (organizationId, input) =>
    prisma.contact.create({
      data: {
        organizationId,
        ...input,
      },
    }),

  findById: (id, organizationId) =>
    prisma.contact.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    }),

  list: ({ organizationId, filters, skip, take, orderBy }: ListContactsRepositoryInput) =>
    prisma.contact.findMany({
      where: buildListWhere(organizationId, filters),
      skip,
      take,
      orderBy,
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
      data: {
        ...input,
      },
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
