import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import type { ListExpensesServiceInput } from '../../types/vehicleServiceTypes';

export const listExpensesMapper = (req: Request): ListExpensesServiceInput => {
  const { organizationId, role } = getRequestContextMapper(req);
  const vehicleId = req.params['id'];

  if (vehicleId === undefined || vehicleId.length === 0) {
    throw new ValidationError('id is required');
  }

  return {
    vehicleId,
    organizationId,
    role,
  };
};
