import type { RecurringExpense, ExpenseCategory, Frequency } from '@prisma/client';

export type { RecurringExpense, Frequency } from '@prisma/client';

// ---------------------------------------------------------------------------
// Service inputs
// ---------------------------------------------------------------------------

export interface CreateRecurringExpenseInput {
  organizationId: string;
  vehicleId: string;
  category: ExpenseCategory;
  label: string;
  amount: number;
  frequency?: Frequency;
  dayOfMonth?: number;
}

export type UpdateRecurringExpenseInput = Partial<
  Omit<CreateRecurringExpenseInput, 'organizationId' | 'vehicleId'>
> & {
  id: string;
  organizationId: string;
};

export interface ListRecurringExpensesInput {
  organizationId: string;
  vehicleId: string;
}

export interface GenerateRecurringInput {
  vehicleId: string;
  organizationId: string;
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface GenerateResult {
  generated: number;
  skipped: number;
}

// ---------------------------------------------------------------------------
// Repository port
// ---------------------------------------------------------------------------

export interface RecurringExpenseRepoPort {
  create(data: CreateRecurringExpenseInput): Promise<RecurringExpense>;
  findById(id: string): Promise<RecurringExpense | null>;
  findMany(input: ListRecurringExpensesInput): Promise<RecurringExpense[]>;
  findActiveByVehicle(vehicleId: string): Promise<RecurringExpense[]>;
  update(id: string, data: Partial<CreateRecurringExpenseInput>): Promise<RecurringExpense>;
  deactivate(id: string): Promise<RecurringExpense>;
  updateLastGeneratedAt(id: string, date: Date): Promise<void>;
}

// ---------------------------------------------------------------------------
// Service interface & deps
// ---------------------------------------------------------------------------

export interface RecurringExpenseServicePort {
  create(input: CreateRecurringExpenseInput): Promise<RecurringExpense>;
  list(input: ListRecurringExpensesInput): Promise<RecurringExpense[]>;
  update(input: UpdateRecurringExpenseInput): Promise<RecurringExpense>;
  deactivate(input: { id: string; organizationId: string }): Promise<void>;
  generate(input: GenerateRecurringInput): Promise<GenerateResult>;
}

export interface RecurringExpenseServiceDeps {
  recurringExpenseRepo: RecurringExpenseRepoPort;
  logger: {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
  };
}
