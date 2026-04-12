import type { Request } from 'express';
import type { ListRecurringExpensesInput } from '../../types/recurringExpenseTypes';

export const listRecurringExpensesMapper = (req: Request): ListRecurringExpensesInput => ({
  organizationId: req.organizationId ?? '',
  vehicleId: req.query['vehicleId'] as string,
});
