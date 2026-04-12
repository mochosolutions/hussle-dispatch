import type { EventBus } from '@/shared/messaging/eventBus';
import type { ExpenseRepoPort } from '../types/expenseTypes';
import type {
  CreateRecurringExpenseInput,
  GenerateRecurringInput,
  GenerateResult,
  ListRecurringExpensesInput,
  RecurringExpense,
  RecurringExpenseRepoPort,
  RecurringExpenseServiceDeps,
  RecurringExpenseServicePort,
  UpdateRecurringExpenseInput,
} from '../types/recurringExpenseTypes';
import { NotFoundError } from '@/shared/errors';

// ---------------------------------------------------------------------------
// Idempotency helpers
// ---------------------------------------------------------------------------

const isSameMonth = (date: Date, now: Date): boolean =>
  date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();

const getISOWeek = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
    )
  );
};

const isSameWeek = (date: Date, now: Date): boolean =>
  date.getFullYear() === now.getFullYear() && getISOWeek(date) === getISOWeek(now);

const isWithinCurrentPeriod = (
  lastGeneratedAt: Date,
  frequency: 'WEEKLY' | 'MONTHLY',
  now: Date,
): boolean => {
  if (frequency === 'MONTHLY') {
    return isSameMonth(lastGeneratedAt, now);
  }
  return isSameWeek(lastGeneratedAt, now);
};

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

export const createRecurringExpenseService = (
  deps: RecurringExpenseServiceDeps & { expenseRepo: ExpenseRepoPort; eventBus: EventBus },
): RecurringExpenseServicePort => ({
  create: async (input: CreateRecurringExpenseInput): Promise<RecurringExpense> => {
    const created = await deps.recurringExpenseRepo.create(input);

    deps.logger.info('Recurring expense created', {
      recurringExpenseId: created.id,
      vehicleId: created.vehicleId,
    });

    return created;
  },

  list: async (input: ListRecurringExpensesInput): Promise<RecurringExpense[]> =>
    deps.recurringExpenseRepo.findMany(input),

  update: async (input: UpdateRecurringExpenseInput): Promise<RecurringExpense> => {
    const existing = await deps.recurringExpenseRepo.findById(input.id);

    if (!existing) {
      throw new NotFoundError(`Recurring expense with id ${input.id} not found`);
    }

    const { id: _id, organizationId: _orgId, ...updateFields } = input;
    const updated = await deps.recurringExpenseRepo.update(input.id, updateFields);

    return updated;
  },

  deactivate: async (input: { id: string; organizationId: string }): Promise<void> => {
    const existing = await deps.recurringExpenseRepo.findById(input.id);

    if (!existing) {
      throw new NotFoundError(`Recurring expense with id ${input.id} not found`);
    }

    await deps.recurringExpenseRepo.deactivate(input.id);

    deps.logger.info('Recurring expense deactivated', {
      recurringExpenseId: input.id,
      organizationId: input.organizationId,
    });
  },

  generate: async (input: GenerateRecurringInput): Promise<GenerateResult> => {
    const activeEntries = await deps.recurringExpenseRepo.findActiveByVehicle(input.vehicleId);
    const now = new Date();
    let generated = 0;
    let skipped = 0;

    for (const entry of activeEntries) {
      if (
        entry.lastGeneratedAt !== null &&
        isWithinCurrentPeriod(entry.lastGeneratedAt, entry.frequency, now)
      ) {
        skipped += 1;
        continue;
      }

      await deps.expenseRepo.create({
        organizationId: input.organizationId,
        vehicleId: input.vehicleId,
        category: entry.category,
        amount: Number(entry.amount),
        date: now,
        source: 'RECURRING',
        isRecurring: true,
        recurringExpenseId: entry.id,
        vendor: entry.label,
      });

      await deps.recurringExpenseRepo.updateLastGeneratedAt(entry.id, now);

      generated += 1;
    }

    if (generated > 0) {
      deps.eventBus
        .publish('recurring-expense.generated', {
          vehicleId: input.vehicleId,
          organizationId: input.organizationId,
          count: generated,
        })
        .catch((error: unknown) => {
          deps.logger.error('Failed to publish recurring-expense.generated event', { error });
        });
    }

    return { generated, skipped };
  },
});
