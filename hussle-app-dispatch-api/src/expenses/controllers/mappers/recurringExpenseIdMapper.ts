import type { Request } from 'express';

export interface RecurringExpenseIdInput {
  id: string;
  organizationId: string;
}

export const recurringExpenseIdMapper = (req: Request): RecurringExpenseIdInput => ({
  id: req.params['id'] ?? '',
  organizationId: req.organizationId ?? '',
});
