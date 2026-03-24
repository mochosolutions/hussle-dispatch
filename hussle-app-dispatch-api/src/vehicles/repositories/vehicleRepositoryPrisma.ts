import type { Prisma, PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  ListVehiclesRepositoryInput,
  VehicleExpenseInput,
  VehicleQueryInput,
  VehicleRepositoryPort,
} from '../types/vehicleTypes';

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
): VehicleRepositoryPort => ({
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

  createExpense: (vehicleId, expense) =>
    prisma.truckExpense.create({
      data: {
        vehicleId,
        category: expense.category,
        expenseKey: expense.expenseKey,
        label: expense.label,
        monthlyAmount: expense.monthlyAmount ?? 0,
      },
    }),

  findExpensesByVehicleId: (vehicleId) =>
    prisma.truckExpense.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
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

  assignDriver: (vehicleId, driverId) =>
    prisma.vehicle.update({
      where: { id: vehicleId },
      data: { driverId },
      include: includeExpenses,
    }),

  unassignDriver: (vehicleId) =>
    prisma.vehicle.update({
      where: { id: vehicleId },
      data: { driverId: null },
      include: includeExpenses,
    }),

  findByDriverId: (driverId) =>
    prisma.vehicle.findFirst({
      where: {
        driverId,
        deletedAt: null,
      },
      include: includeExpenses,
    }),
});
