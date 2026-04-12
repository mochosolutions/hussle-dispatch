import type { PrismaClient, Expense, Prisma } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  CreateExpenseRepoInput,
  ExpenseRepoPort,
  ListExpensesInput,
  PaginatedExpenses,
} from '../types/expenseTypes';
import { buildPaginationMeta } from '@/shared/responseEnvelope';

type ExpenseWhereInput = Prisma.ExpenseWhereInput;

const buildWhereClause = (
  input: Omit<ListExpensesInput, 'page' | 'limit' | 'sort' | 'order'>,
): ExpenseWhereInput => {
  const where: ExpenseWhereInput = {
    organizationId: input.organizationId,
    vehicleId: input.vehicleId,
    deletedAt: null,
  };

  if (input.driverId !== undefined) {
    where.driverId = input.driverId;
  }

  if (input.category !== undefined) {
    where.category = input.category;
  }

  if (input.source !== undefined) {
    where.source = input.source;
  }

  if (input.dateFrom !== undefined || input.dateTo !== undefined) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (input.dateFrom !== undefined) {
      dateFilter.gte = new Date(input.dateFrom);
    }
    if (input.dateTo !== undefined) {
      dateFilter.lte = new Date(input.dateTo);
    }
    where.date = dateFilter;
  }

  if (input.hasReceipt === true) {
    where.receiptUrl = { not: null };
  } else if (input.hasReceipt === false) {
    where.receiptUrl = null;
  }

  return where;
};

export const expenseRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): ExpenseRepoPort => ({
  create: (data: CreateExpenseRepoInput): Promise<Expense> =>
    prisma.expense.create({ data }),

  findById: (id: string, organizationId: string): Promise<Expense | null> =>
    prisma.expense.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    }),

  findMany: async (input: ListExpensesInput): Promise<PaginatedExpenses> => {
    const where = buildWhereClause(input);
    const skip = (input.page - 1) * input.limit;

    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { [input.sort]: input.order },
        skip,
        take: input.limit,
      }),
      prisma.expense.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, input.page, input.limit);

    return { data, meta };
  },

  update: (id: string, data: Partial<CreateExpenseRepoInput>): Promise<Expense> =>
    prisma.expense.update({
      where: { id },
      data,
    }),

  softDelete: (id: string): Promise<Expense> =>
    prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    }),

  count: (input: Omit<ListExpensesInput, 'page' | 'limit' | 'sort' | 'order'>): Promise<number> =>
    prisma.expense.count({
      where: buildWhereClause(input),
    }),
});
