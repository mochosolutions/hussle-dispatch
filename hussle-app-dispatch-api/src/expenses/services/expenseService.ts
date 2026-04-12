import type { EventBus } from '@/shared/messaging/eventBus';
import type {
  CreateExpenseInput,
  CreateExpenseRepoInput,
  DeleteExpenseInput,
  Expense,
  ExpenseServiceDeps,
  ExpenseServicePort,
  GetExpenseInput,
  ListExpensesInput,
  PaginatedExpenses,
  UpdateExpenseInput,
} from '../types/expenseTypes';
import { NotFoundError, ValidationError } from '@/shared/errors';

const FUEL_FIELD_NAMES = ['amount', 'gallons', 'pricePerGallon'] as const;
const FUEL_ONLY_FIELDS = ['gallons', 'pricePerGallon', 'fuelType', 'odometer'] as const;

const isFuelFieldProvided = (
  value: number | undefined | null,
): value is number => value !== undefined && value !== null;

const countProvidedFuelFields = (input: {
  amount?: number;
  gallons?: number;
  pricePerGallon?: number;
}): number =>
  FUEL_FIELD_NAMES.filter((field) => isFuelFieldProvided(input[field])).length;

const resolveFuelFields = (input: {
  amount?: number;
  gallons?: number;
  pricePerGallon?: number;
}): { amount: number; gallons: number; pricePerGallon: number } => {
  const { amount, gallons, pricePerGallon } = input;

  if (isFuelFieldProvided(amount) && isFuelFieldProvided(gallons) && isFuelFieldProvided(pricePerGallon)) {
    return { amount, gallons, pricePerGallon };
  }

  if (isFuelFieldProvided(gallons) && isFuelFieldProvided(pricePerGallon)) {
    return { amount: gallons * pricePerGallon, gallons, pricePerGallon };
  }

  if (isFuelFieldProvided(amount) && isFuelFieldProvided(pricePerGallon)) {
    return { amount, gallons: amount / pricePerGallon, pricePerGallon };
  }

  // amount and gallons provided
  return {
    amount: amount as number,
    gallons: gallons as number,
    pricePerGallon: (amount as number) / (gallons as number),
  };
};

const validateFuelCreate = (input: CreateExpenseInput): void => {
  const provided = countProvidedFuelFields(input);
  if (provided < 2) {
    throw new ValidationError(
      'Fuel expenses require at least 2 of: amount, gallons, pricePerGallon',
    );
  }

  if (input.state === undefined || input.state === null) {
    throw new ValidationError('Fuel expenses require a state for IFTA reporting');
  }
};

const validateNonFuelFields = (input: {
  gallons?: number;
  pricePerGallon?: number;
  fuelType?: string;
  odometer?: number;
}): void => {
  const hasFuelField = FUEL_ONLY_FIELDS.some(
    (field) => input[field] !== undefined && input[field] !== null,
  );
  if (hasFuelField) {
    throw new ValidationError(
      'Fuel-specific fields are not allowed for non-fuel expenses',
    );
  }
};

const toDate = (value: Date | string): Date =>
  value instanceof Date ? value : new Date(value);

export const createExpenseService = (
  deps: ExpenseServiceDeps & { eventBus: EventBus },
): ExpenseServicePort => ({
  createExpense: async (input: CreateExpenseInput): Promise<Expense> => {
    let resolvedAmount: number;
    let resolvedGallons: number | undefined = input.gallons;
    let resolvedPricePerGallon: number | undefined = input.pricePerGallon;
    let resolvedFuelType = input.fuelType;

    if (input.category === 'FUEL') {
      validateFuelCreate(input);
      const fuel = resolveFuelFields(input);
      resolvedAmount = fuel.amount;
      resolvedGallons = fuel.gallons;
      resolvedPricePerGallon = fuel.pricePerGallon;
      resolvedFuelType = input.fuelType ?? 'DIESEL';
    } else {
      validateNonFuelFields(input);
      if (input.amount === undefined || input.amount === null) {
        throw new ValidationError('Amount is required for non-fuel expenses');
      }
      resolvedAmount = input.amount;
    }

    const repoInput: CreateExpenseRepoInput = {
      organizationId: input.organizationId,
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      category: input.category,
      vendor: input.vendor,
      amount: resolvedAmount,
      date: toDate(input.date),
      state: input.state,
      notes: input.notes,
      gallons: resolvedGallons,
      pricePerGallon: resolvedPricePerGallon,
      fuelType: resolvedFuelType,
      odometer: input.odometer,
    };

    const expense = await deps.expenseRepo.create(repoInput);

    deps.eventBus
      .publish('expense.created', {
        expenseId: expense.id,
        vehicleId: expense.vehicleId,
        organizationId: expense.organizationId,
        category: expense.category,
      })
      .catch((error: unknown) => {
        deps.logger.error('Failed to publish expense.created event', { error });
      });

    return expense;
  },

  getExpenseById: async (input: GetExpenseInput): Promise<Expense> => {
    const expense = await deps.expenseRepo.findById(input.id, input.organizationId);

    if (!expense) {
      throw new NotFoundError(`Expense with id ${input.id} not found`);
    }

    return expense;
  },

  listExpenses: async (input: ListExpensesInput): Promise<PaginatedExpenses> =>
    deps.expenseRepo.findMany(input),

  updateExpense: async (input: UpdateExpenseInput): Promise<Expense> => {
    const existing = await deps.expenseRepo.findById(input.id, input.organizationId);

    if (!existing) {
      throw new NotFoundError(`Expense with id ${input.id} not found`);
    }

    const effectiveCategory = input.category ?? existing.category;

    if (effectiveCategory === 'FUEL') {
      // For fuel updates, validate only if fuel-related fields are being changed
      const hasFuelFieldChange =
        input.amount !== undefined ||
        input.gallons !== undefined ||
        input.pricePerGallon !== undefined;

      if (hasFuelFieldChange) {
        // Merge existing values with updates to validate the complete picture
        const mergedAmount = input.amount ?? existing.amount?.toNumber();
        const mergedGallons = input.gallons ?? existing.gallons?.toNumber();
        const mergedPricePerGallon =
          input.pricePerGallon ?? existing.pricePerGallon?.toNumber();

        const provided = countProvidedFuelFields({
          amount: mergedAmount,
          gallons: mergedGallons,
          pricePerGallon: mergedPricePerGallon,
        });

        if (provided < 2) {
          throw new ValidationError(
            'Fuel expenses require at least 2 of: amount, gallons, pricePerGallon',
          );
        }

        const fuel = resolveFuelFields({
          amount: mergedAmount,
          gallons: mergedGallons,
          pricePerGallon: mergedPricePerGallon,
        });

        input = {
          ...input,
          amount: fuel.amount,
          gallons: fuel.gallons,
          pricePerGallon: fuel.pricePerGallon,
        };
      }

      // Validate state is present (either in update or existing)
      if (input.state !== undefined && (input.state === null || input.state === '')) {
        throw new ValidationError('Fuel expenses require a state for IFTA reporting');
      }

      // Default fuelType if switching to FUEL category
      if (input.category === 'FUEL' && existing.category !== 'FUEL') {
        if (input.fuelType === undefined && existing.fuelType === null) {
          input = { ...input, fuelType: 'DIESEL' };
        }
      }
    } else {
      validateNonFuelFields(input);
    }

    const updateData: Partial<CreateExpenseRepoInput> = {};

    if (input.vehicleId !== undefined) {
      updateData.vehicleId = input.vehicleId;
    }
    if (input.driverId !== undefined) {
      updateData.driverId = input.driverId;
    }
    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    if (input.vendor !== undefined) {
      updateData.vendor = input.vendor;
    }
    if (input.amount !== undefined) {
      updateData.amount = input.amount;
    }
    if (input.date !== undefined) {
      updateData.date = toDate(input.date);
    }
    if (input.state !== undefined) {
      updateData.state = input.state;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }
    if (input.gallons !== undefined) {
      updateData.gallons = input.gallons;
    }
    if (input.pricePerGallon !== undefined) {
      updateData.pricePerGallon = input.pricePerGallon;
    }
    if (input.fuelType !== undefined) {
      updateData.fuelType = input.fuelType;
    }
    if (input.odometer !== undefined) {
      updateData.odometer = input.odometer;
    }

    const updated = await deps.expenseRepo.update(input.id, updateData);

    deps.eventBus
      .publish('expense.updated', {
        expenseId: updated.id,
        vehicleId: updated.vehicleId,
        organizationId: updated.organizationId,
      })
      .catch((error: unknown) => {
        deps.logger.error('Failed to publish expense.updated event', { error });
      });

    return updated;
  },

  softDeleteExpense: async (input: DeleteExpenseInput): Promise<void> => {
    const existing = await deps.expenseRepo.findById(input.id, input.organizationId);

    if (!existing) {
      throw new NotFoundError(`Expense with id ${input.id} not found`);
    }

    const deleted = await deps.expenseRepo.softDelete(input.id);

    deps.eventBus
      .publish('expense.deleted', {
        expenseId: deleted.id,
        vehicleId: deleted.vehicleId,
        organizationId: deleted.organizationId,
      })
      .catch((error: unknown) => {
        deps.logger.error('Failed to publish expense.deleted event', { error });
      });
  },
});
