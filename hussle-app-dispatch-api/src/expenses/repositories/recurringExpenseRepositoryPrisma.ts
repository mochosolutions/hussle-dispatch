import type { PrismaClient, RecurringExpense } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  CreateRecurringExpenseInput,
  ListRecurringExpensesInput,
  RecurringExpenseRepoPort,
} from '../types/recurringExpenseTypes';
import { ConflictError } from '@/shared/errors';

const catchUniqueViolation = (error: unknown, label: string): never => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictError(
      `A recurring expense with label '${label}' already exists for this vehicle`,
    );
  }
  throw error;
};

export const recurringExpenseRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): RecurringExpenseRepoPort => ({
  create: async (data: CreateRecurringExpenseInput): Promise<RecurringExpense> => {
    try {
      return await prisma.recurringExpense.create({ data });
    } catch (error: unknown) {
      return catchUniqueViolation(error, data.label);
    }
  },

  findById: (id: string): Promise<RecurringExpense | null> =>
    prisma.recurringExpense.findUnique({ where: { id } }),

  findMany: (input: ListRecurringExpensesInput): Promise<RecurringExpense[]> =>
    prisma.recurringExpense.findMany({
      where: {
        vehicleId: input.vehicleId,
        organizationId: input.organizationId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    }),

  findActiveByVehicle: (vehicleId: string): Promise<RecurringExpense[]> =>
    prisma.recurringExpense.findMany({
      where: { vehicleId, isActive: true },
    }),

  update: async (
    id: string,
    data: Partial<CreateRecurringExpenseInput>,
  ): Promise<RecurringExpense> => {
    try {
      return await prisma.recurringExpense.update({ where: { id }, data });
    } catch (error: unknown) {
      return catchUniqueViolation(error, data.label ?? '');
    }
  },

  deactivate: (id: string): Promise<RecurringExpense> =>
    prisma.recurringExpense.update({
      where: { id },
      data: { isActive: false },
    }),

  updateLastGeneratedAt: async (id: string, date: Date): Promise<void> => {
    await prisma.recurringExpense.update({
      where: { id },
      data: { lastGeneratedAt: date },
    });
  },
});
