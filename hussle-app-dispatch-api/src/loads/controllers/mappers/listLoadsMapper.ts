import type { EquipmentType, LoadStatus } from '@prisma/client';
import type { Request } from 'express';
import type { LoadListFilters } from '../../types/loadTypes';
import type { ListLoadsServiceInput } from '../../types/loadServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

const parseStatusFilter = (value: unknown): LoadStatus[] | undefined => {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined;
  }

  return value.split(',') as LoadStatus[];
};

const parseEquipmentType = (value: unknown): EquipmentType | undefined => {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined;
  }
  return value as EquipmentType;
};

const parseDate = (value: unknown): Date | undefined => {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date;
};

export const listLoadsMapper = (req: Request): ListLoadsServiceInput => {
  const context = getRequestContextMapper(req);

  const filters: LoadListFilters = {
    status: parseStatusFilter(req.query['status']),
    carrierId: typeof req.query['carrierId'] === 'string' ? req.query['carrierId'] : undefined,
    customerId: typeof req.query['customerId'] === 'string' ? req.query['customerId'] : undefined,
    equipmentType: parseEquipmentType(req.query['equipmentType']),
    search: typeof req.query['search'] === 'string' ? req.query['search'] : undefined,
    dateFrom: parseDate(req.query['dateFrom']),
    dateTo: parseDate(req.query['dateTo']),
  };

  return {
    ...context,
    query: req.query,
    filters,
  };
};
