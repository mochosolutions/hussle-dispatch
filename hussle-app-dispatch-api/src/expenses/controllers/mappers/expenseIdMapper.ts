import type { Request } from 'express';
import type { GetExpenseInput } from '../../types/expenseTypes';

export const expenseIdMapper = (req: Request): GetExpenseInput => ({
  id: req.params['id'] ?? '',
  organizationId: req.organizationId ?? '',
});
