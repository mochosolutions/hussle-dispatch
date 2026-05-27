import type { Request } from 'express';
import type { UpdateCustomerInput } from '../../types/customerTypes';
import type { UpdateCustomerServiceInput } from '../../types/customerServiceTypes';
import { getRequiredCustomerIdMapper } from './getRequiredCustomerIdMapper';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const updateCustomerMapper = (req: Request): UpdateCustomerServiceInput => {
  const context = getRequestContextMapper(req);
  const id = getRequiredCustomerIdMapper(req);
  const input: UpdateCustomerInput = req.body;

  return {
    ...context,
    id,
    input,
  };
};
