import type { Request } from 'express';
import { ContactType } from '@prisma/client';
import type { ContactListFilters } from '../../types/contactTypes';
import type { ListContactsServiceInput } from '../../types/contactServiceTypes';
import { getRequestContextMapper } from './getRequestContextMapper';

const toContactType = (value: unknown): ContactType | undefined => {
  if (value === ContactType.BROKER) {
    return ContactType.BROKER;
  }

  if (value === ContactType.SHIPPER) {
    return ContactType.SHIPPER;
  }

  if (value === ContactType.CONSIGNEE) {
    return ContactType.CONSIGNEE;
  }

  if (value === ContactType.FACTORING) {
    return ContactType.FACTORING;
  }

  return undefined;
};

export const listContactsMapper = (req: Request): ListContactsServiceInput => {
  const context = getRequestContextMapper(req);

  const filters: ContactListFilters = {
    type: toContactType(req.query['type']),
    search: typeof req.query['search'] === 'string' ? req.query['search'] : undefined,
  };

  return {
    ...context,
    query: req.query,
    filters,
  };
};
