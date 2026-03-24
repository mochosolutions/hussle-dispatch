import type { Request } from 'express';
import type { ContactListFilters } from '../../types/contactTypes';
import type { ListContactsServiceInput } from '../../types/contactServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const listContactsMapper = (req: Request): ListContactsServiceInput => {
  const context = getRequestContextMapper(req);

  const filters: ContactListFilters = {
    customerId: typeof req.query['customerId'] === 'string' ? req.query['customerId'] : undefined,
    search: typeof req.query['search'] === 'string' ? req.query['search'] : undefined,
  };

  return {
    ...context,
    query: req.query,
    filters,
  };
};
