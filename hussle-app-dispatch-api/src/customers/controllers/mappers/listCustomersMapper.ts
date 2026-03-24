import { CustomerType, CustomerStatus } from '@prisma/client';
import type { Request } from 'express';
import type { CustomerListFilters } from '../../types/customerTypes';
import type { ListCustomersServiceInput } from '../../types/customerServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

const parseCustomerType = (value: unknown): CustomerType | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const enumValues = Object.values(CustomerType);
  const matched = enumValues.find((enumValue) => enumValue === value);
  return matched;
};

const parseCustomerStatus = (value: unknown): CustomerStatus | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const enumValues = Object.values(CustomerStatus);
  const matched = enumValues.find((enumValue) => enumValue === value);
  return matched;
};

export const listCustomersMapper = (req: Request): ListCustomersServiceInput => {
  const context = getRequestContextMapper(req);

  const filters: CustomerListFilters = {
    type: parseCustomerType(req.query['type']),
    status: parseCustomerStatus(req.query['status']),
    search: typeof req.query['search'] === 'string' ? req.query['search'] : undefined,
  };

  return {
    ...context,
    query: req.query,
    filters,
  };
};
