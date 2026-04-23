import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import { NotFoundError } from '@/shared/errors/commonErrors';
import type {
  CreateCustomerInput,
  CustomerQueryInput,
  CustomerRepositoryPort,
  CustomerWithCounts,
  CustomerWithDetails,
  ListCustomersRepositoryInput,
  UpdateCustomerInput,
} from '../types/customerTypes';

const selectWithCounts = {
  _count: {
    select: {
      loads: {
        where: {
          deletedAt: null,
        },
      },
      contacts: true,
      places: true,
    },
  },
} as const;

const selectWithDetails = {
  ...selectWithCounts,
  loads: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' as const },
  },
  contacts: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

const buildListWhere = (
  organizationId: string,
  filters: ListCustomersRepositoryInput['filters'],
) => {
  const where: {
    organizationId: string;
    deleted: false;
    type?: ListCustomersRepositoryInput['filters']['type'];
    status?: ListCustomersRepositoryInput['filters']['status'];
    OR?: {
      companyName?: { contains: string; mode: 'insensitive' };
      mcNumber?: { contains: string; mode: 'insensitive' };
      dotNumber?: { contains: string; mode: 'insensitive' };
    }[];
  } = {
    organizationId,
    deleted: false,
  };

  if (filters.type !== undefined) {
    where.type = filters.type;
  }

  if (filters.status !== undefined) {
    where.status = filters.status;
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
        mcNumber: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        dotNumber: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
};

export const customerRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): CustomerRepositoryPort => ({
  create: (organizationId: string, input: CreateCustomerInput): Promise<CustomerWithCounts> =>
    prisma.customer.create({
      data: {
        organizationId,
        ...input,
      },
      include: selectWithCounts,
    }),

  findById: (id: string, organizationId: string): Promise<CustomerWithCounts | null> =>
    prisma.customer.findFirst({
      where: {
        id,
        organizationId,
        deleted: false,
      },
      include: selectWithCounts,
    }),

  findByIdWithDetails: (
    id: string,
    organizationId: string,
  ): Promise<CustomerWithDetails | null> =>
    prisma.customer.findFirst({
      where: {
        id,
        organizationId,
        deleted: false,
      },
      include: selectWithDetails,
    }),

  list: ({ organizationId, filters, skip, take, orderBy }: ListCustomersRepositoryInput) =>
    prisma.customer.findMany({
      where: buildListWhere(organizationId, filters),
      skip,
      take,
      orderBy,
      include: selectWithCounts,
    }),

  count: ({ organizationId, filters }: CustomerQueryInput): Promise<number> =>
    prisma.customer.count({
      where: buildListWhere(organizationId, filters),
    }),

  update: async (id: string, organizationId: string, input: UpdateCustomerInput): Promise<CustomerWithCounts> => {
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId, deleted: false },
    });
    if (!customer) {
      throw new NotFoundError(`Customer with id ${id} not found`);
    }
    return prisma.customer.update({
      where: { id },
      data: { ...input },
      include: selectWithCounts,
    });
  },

  softDelete: async (id: string, organizationId: string, deletedAt: Date): Promise<void> => {
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId, deleted: false },
    });
    if (!customer) {
      throw new NotFoundError(`Customer with id ${id} not found`);
    }
    await prisma.customer.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt,
      },
    });
  },

  countByOrganization: (organizationId: string): Promise<number> =>
    prisma.customer.count({
      where: {
        organizationId,
        deleted: false,
      },
    }),
});
