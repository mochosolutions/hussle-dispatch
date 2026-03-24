import type { TruckExpense } from '@prisma/client';

export interface ExpenseResponse {
  id: string;
  vehicleId: string;
  category: string;
  expenseKey: string;
  label: string;
  monthlyAmount: string;
  createdAt: string;
  updatedAt: string;
}

export const toExpenseResponse = (expense: TruckExpense): ExpenseResponse => ({
  id: expense.id,
  vehicleId: expense.vehicleId,
  category: expense.category,
  expenseKey: expense.expenseKey,
  label: expense.label,
  monthlyAmount: expense.monthlyAmount.toString(),
  createdAt: expense.createdAt.toISOString(),
  updatedAt: expense.updatedAt.toISOString(),
});

export const toExpenseListResponse = (expenses: TruckExpense[]): ExpenseResponse[] =>
  expenses.map(toExpenseResponse);
