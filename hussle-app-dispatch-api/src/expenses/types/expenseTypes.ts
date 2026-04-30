import type { PaginationMeta } from '@/shared/responseEnvelope';
import type { SortOrder } from '@/shared/pagination';

export type { Expense, ExpenseCategory, ExpenseSource, FuelType } from '@prisma/client';

import type { Expense, ExpenseCategory, ExpenseSource, FuelType } from '@prisma/client';

// ---------------------------------------------------------------------------
// Service inputs
// ---------------------------------------------------------------------------

export interface CreateExpenseInput {
  organizationId: string;
  vehicleId: string;
  driverId?: string;
  category: ExpenseCategory;
  vendor?: string;
  amount?: number;
  date: Date | string;
  state?: string;
  notes?: string;
  gallons?: number;
  pricePerGallon?: number;
  fuelType?: FuelType;
  odometer?: number;
}

export type UpdateExpenseInput = Partial<Omit<CreateExpenseInput, 'organizationId'>> & {
  id: string;
  organizationId: string;
};

export interface ListExpensesInput {
  organizationId: string;
  vehicleId?: string;
  driverId?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: ExpenseCategory;
  hasReceipt?: boolean;
  source?: ExpenseSource;
  page: number;
  limit: number;
  sort: 'date' | 'amount' | 'category';
  order: SortOrder;
}

export interface GetExpenseInput {
  id: string;
  organizationId: string;
}

export interface DeleteExpenseInput {
  id: string;
  organizationId: string;
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface PaginatedExpenses {
  data: Expense[];
  meta: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Repository port
// ---------------------------------------------------------------------------

export interface CreateExpenseRepoInput {
  organizationId: string;
  vehicleId: string;
  driverId?: string;
  category: ExpenseCategory;
  vendor?: string;
  amount: number;
  date: Date;
  state?: string;
  notes?: string;
  gallons?: number;
  pricePerGallon?: number;
  fuelType?: FuelType;
  odometer?: number;
  source?: ExpenseSource;
  receiptUrl?: string;
  isRecurring?: boolean;
  recurringExpenseId?: string;
  externalTransactionId?: string;
}

export interface ExpenseRepoPort {
  create(data: CreateExpenseRepoInput): Promise<Expense>;
  findById(id: string, organizationId: string): Promise<Expense | null>;
  findMany(input: ListExpensesInput): Promise<PaginatedExpenses>;
  update(id: string, organizationId: string, data: Partial<CreateExpenseRepoInput>): Promise<Expense>;
  softDelete(id: string, organizationId: string): Promise<Expense>;
  count(input: Omit<ListExpensesInput, 'page' | 'limit' | 'sort' | 'order'>): Promise<number>;
}

// ---------------------------------------------------------------------------
// Service interface & deps
// ---------------------------------------------------------------------------

export interface ExpenseServicePort {
  createExpense(input: CreateExpenseInput): Promise<Expense>;
  getExpenseById(input: GetExpenseInput): Promise<Expense>;
  listExpenses(input: ListExpensesInput): Promise<PaginatedExpenses>;
  updateExpense(input: UpdateExpenseInput): Promise<Expense>;
  softDeleteExpense(input: DeleteExpenseInput): Promise<void>;
}

export interface ExpenseServiceDeps {
  expenseRepo: ExpenseRepoPort;
  logger: {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
  };
}
