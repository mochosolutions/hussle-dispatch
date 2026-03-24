import type { Request } from 'express';
import type { CreateCustomerInput } from '../../types/customerTypes';
import type { CreateCustomerServiceInput } from '../../types/customerServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const createCustomerMapper = (req: Request): CreateCustomerServiceInput => {
  const context = getRequestContextMapper(req);
  const input: CreateCustomerInput = req.body;

  return {
    ...context,
    input,
  };
};
