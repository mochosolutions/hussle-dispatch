import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import type { CreateExpenseServiceInput } from '../../types/vehicleServiceTypes';

export const createExpenseMapper = (req: Request): CreateExpenseServiceInput => {
  const { organizationId, role } = getRequestContextMapper(req);
  const vehicleId = req.params['id'];

  if (vehicleId === undefined || vehicleId.length === 0) {
    throw new ValidationError('id is required');
  }

  return {
    vehicleId,
    organizationId,
    role,
    input: {
      category: req.body.category,
      expenseKey: req.body.expenseKey,
      label: req.body.label,
      monthlyAmount: req.body.monthlyAmount,
    },
  };
};
