import type { Prisma, PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  CarrierRepositoryPort,
  ListVehiclesRepositoryInput,
  LoadRepositoryPort,
  VehicleExpenseInput,
  VehicleQueryInput,
  VehicleRepositoryPort,
} from '../types/vehicleTypes';

type VehiclePersistence = VehicleRepositoryPort & CarrierRepositoryPort & LoadRepositoryPort;

const includeExpenses = {
  expenses: true,
} as const;

const toExpenseCreateManyData = (vehicleId: string, expenses: VehicleExpenseInput[]) =>
  expenses.map((expense) => ({
    vehicleId,
    category: expense.category,
    expenseKey: expense.expenseKey,
    label: expense.label,
    monthlyAmount: expense.monthlyAmount ?? 0,
  }));

const buildListWhere = (
  organizationId: string,
  filters: ListVehiclesRepositoryInput['filters'],
): Prisma.VehicleWhereInput => {
  const where: Prisma.VehicleWhereInput = {
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
        unitNumber: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        make: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
      {
        model: {
          contains: filters.search,
          mode: 'insensitive',
        },
      },
    ];
  }

  return where;
};

export const vehicleRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): VehiclePersistence => ({
  create: (input) =>
    prisma.vehicle.create({
      data: input,
      include: includeExpenses,
    }),

  findById: (id, organizationId) =>
    prisma.vehicle.findFirst({
      where: {
        id,
        deletedAt: null,
        carrier: {
          managedByOrgId: organizationId,
          deletedAt: null,
        },
      },
      include: includeExpenses,
    }),

  list: ({ organizationId, filters, skip, take, orderBy }) =>
    prisma.vehicle.findMany({
      where: buildListWhere(organizationId, filters),
      skip,
      take,
      orderBy,
      include: includeExpenses,
    }),

  count: ({ organizationId, filters }: VehicleQueryInput) =>
    prisma.vehicle.count({
      where: buildListWhere(organizationId, filters),
    }),

  update: (id, input) =>
    prisma.vehicle.update({
      where: {
        id,
      },
      data: input,
      include: includeExpenses,
    }),

  replaceExpenses: async (vehicleId, expenses) => {
    await prisma.truckExpense.deleteMany({
      where: {
        vehicleId,
      },
    });

    if (expenses.length > 0) {
      await prisma.truckExpense.createMany({
        data: toExpenseCreateManyData(vehicleId, expenses),
      });
    }
  },

  softDelete: async (id, deletedAt) => {
    await prisma.vehicle.update({
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
        status: 'active',
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    return carrier !== null;
  },

  findBlockingLoadIdsByVehicle: async (vehicleId, statuses, limit) => {
    const loads = await prisma.load.findMany({
      where: {
        vehicleId,
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
