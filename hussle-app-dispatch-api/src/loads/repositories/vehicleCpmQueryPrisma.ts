import type { Prisma, PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { VehicleCpmQueryPort } from '../types/loadTypes';
import { CPM_CATEGORY_MAP } from '@/shared/constants/expenseCpmCategories';

export const vehicleCpmQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): VehicleCpmQueryPort => ({
  getRecurringExpenses: async (vehicleId) => {
    const [expenses, vehicle] = await Promise.all([
      prisma.recurringExpense.findMany({
        where: { vehicleId, isActive: true },
        select: { amount: true },
      }),
      prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { monthlyMilesTarget: true },
      }),
    ]);

    const milesPerMonth = vehicle?.monthlyMilesTarget ?? 0;

    return expenses.map((expense) => ({
      amount: Number(expense.amount),
      milesPerMonth,
    }));
  },

  getActualExpenseSummary: async (vehicleId, dateRange) => {
    const where: Prisma.ExpenseWhereInput = {
      vehicleId,
      deletedAt: null,
    };

    if (dateRange) {
      where.date = { gte: dateRange.from, lte: dateRange.to };
    }

    const expenses = await prisma.expense.findMany({
      where,
      select: { category: true, amount: true },
    });

    let totalFixed = 0;
    let totalVariable = 0;

    expenses.forEach((expense) => {
      const classification = CPM_CATEGORY_MAP[expense.category];
      const amount = Number(expense.amount);
      if (classification === 'FIXED') {
        totalFixed += amount;
      } else {
        totalVariable += amount;
      }
    });

    return { totalFixed, totalVariable, expenseCount: expenses.length };
  },
});
