import type { Request } from 'express';
import type { GenerateRecurringInput } from '../../types/recurringExpenseTypes';

export const generateRecurringMapper = (req: Request): GenerateRecurringInput => ({
  organizationId: req.organizationId ?? '',
  vehicleId: req.body.vehicleId,
});
