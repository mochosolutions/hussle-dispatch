import type { RecurringExpense } from '../../types/recurringExpenseTypes';

export interface RecurringExpenseResponse {
  id: string;
  organizationId: string;
  vehicleId: string;
  category: string;
  label: string;
  amount: number;
  frequency: string;
  dayOfMonth: number | null;
  isActive: boolean;
  lastGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const toRecurringExpenseResponse = (
  recurringExpense: RecurringExpense,
): RecurringExpenseResponse => ({
  id: recurringExpense.id,
  organizationId: recurringExpense.organizationId,
  vehicleId: recurringExpense.vehicleId,
  category: recurringExpense.category,
  label: recurringExpense.label,
  amount: Number(recurringExpense.amount),
  frequency: recurringExpense.frequency,
  dayOfMonth: recurringExpense.dayOfMonth,
  isActive: recurringExpense.isActive,
  lastGeneratedAt: recurringExpense.lastGeneratedAt?.toISOString() ?? null,
  createdAt: recurringExpense.createdAt.toISOString(),
  updatedAt: recurringExpense.updatedAt.toISOString(),
});

export const toRecurringExpenseListResponse = (
  recurringExpenses: RecurringExpense[],
): RecurringExpenseResponse[] => recurringExpenses.map(toRecurringExpenseResponse);
