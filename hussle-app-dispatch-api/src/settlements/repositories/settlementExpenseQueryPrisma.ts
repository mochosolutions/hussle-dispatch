import type { PrismaClient } from '@prisma/client';
import type { SettlementExpenseQueryPort } from '../types/settlementTypes';

export const settlementExpenseQueryPrisma = (
  prisma: PrismaClient,
): SettlementExpenseQueryPort => ({
  findExpenses: async (organizationId, vehicleId, periodStart, periodEnd) =>
    prisma.expense.findMany({
      where: {
        organizationId,
        vehicleId,
        deletedAt: null,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        id: true,
        notes: true,
        category: true,
        amount: true,
        date: true,
      },
    }).then((expenses) =>
      expenses.map((expense) => ({
        id: expense.id,
        description: expense.notes ?? String(expense.category),
        amount: expense.amount,
        date: expense.date,
      })),
    ),
});
