import type { Request } from 'express';
import type { UpdateRecurringExpenseInput } from '../../types/recurringExpenseTypes';

export const updateRecurringExpenseMapper = (req: Request): UpdateRecurringExpenseInput => ({
  id: req.params['id'] ?? '',
  organizationId: req.organizationId ?? '',
  category: req.body.category,
  label: req.body.label,
  amount: req.body.amount,
  frequency: req.body.frequency,
  dayOfMonth: req.body.dayOfMonth,
});
