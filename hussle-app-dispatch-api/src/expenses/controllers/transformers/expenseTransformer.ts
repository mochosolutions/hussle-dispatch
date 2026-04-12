import type { Decimal } from '@prisma/client/runtime/library';
import type { Expense } from '../../types/expenseTypes';
import type { PaginationMeta } from '@/shared/responseEnvelope';

export interface ExpenseResponse {
  id: string;
  organizationId: string;
  vehicleId: string;
  driverId: string | null;
  category: string;
  vendor: string | null;
  amount: number;
  date: string;
  state: string | null;
  notes: string | null;
  receiptUrl: string | null;
  isRecurring: boolean;
  source: string;
  gallons: number | null;
  pricePerGallon: number | null;
  fuelType: string | null;
  odometer: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseListResponse {
  data: ExpenseResponse[];
  meta: PaginationMeta;
}

const decimalToNumber = (value: Decimal | null): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value);
};

export const toExpenseResponse = (expense: Expense): ExpenseResponse => ({
  id: expense.id,
  organizationId: expense.organizationId,
  vehicleId: expense.vehicleId,
  driverId: expense.driverId,
  category: expense.category,
  vendor: expense.vendor,
  amount: Number(expense.amount),
  date: expense.date.toISOString(),
  state: expense.state,
  notes: expense.notes,
  receiptUrl: expense.receiptUrl,
  isRecurring: expense.isRecurring,
  source: expense.source,
  gallons: decimalToNumber(expense.gallons),
  pricePerGallon: decimalToNumber(expense.pricePerGallon),
  fuelType: expense.fuelType,
  odometer: expense.odometer,
  createdAt: expense.createdAt.toISOString(),
  updatedAt: expense.updatedAt.toISOString(),
});

export const toExpenseListResponse = (
  data: Expense[],
  meta: PaginationMeta,
): ExpenseListResponse => ({
  data: data.map(toExpenseResponse),
  meta,
});
