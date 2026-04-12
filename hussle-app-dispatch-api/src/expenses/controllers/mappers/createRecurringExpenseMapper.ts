import type { Request } from 'express';
import type { CreateRecurringExpenseInput } from '../../types/recurringExpenseTypes';

export const createRecurringExpenseMapper = (req: Request): CreateRecurringExpenseInput => ({
  organizationId: req.organizationId ?? '',
  vehicleId: req.body.vehicleId,
  category: req.body.category,
  label: req.body.label,
  amount: req.body.amount,
  frequency: req.body.frequency,
  dayOfMonth: req.body.dayOfMonth,
});
