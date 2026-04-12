import type { Request } from 'express';
import type { SortOrder } from '@/shared/pagination';
import type { ExpenseCategory, ExpenseSource } from '@prisma/client';
import type { ListExpensesInput } from '../../types/expenseTypes';

const parseOptionalInt = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseOptionalBool = (value: unknown): boolean | undefined => {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
};

export const listExpensesMapper = (req: Request): ListExpensesInput => {
  const query = req.query;

  const page = parseOptionalInt(query['page']) ?? 1;
  const limit = parseOptionalInt(query['limit']) ?? 25;

  const rawSort = typeof query['sort'] === 'string' ? query['sort'] : 'date';
  const sort = (['date', 'amount', 'category'] as const).includes(
    rawSort as 'date' | 'amount' | 'category',
  )
    ? (rawSort as 'date' | 'amount' | 'category')
    : 'date';

  const rawOrder = typeof query['order'] === 'string' ? query['order'] : 'desc';
  const order: SortOrder = rawOrder === 'asc' ? 'asc' : 'desc';

  return {
    organizationId: req.organizationId ?? '',
    vehicleId: (query['vehicleId'] as string) ?? '',
    driverId: query['driverId'] as string | undefined,
    dateFrom: query['dateFrom'] as string | undefined,
    dateTo: query['dateTo'] as string | undefined,
    category: query['category'] as ExpenseCategory | undefined,
    hasReceipt: parseOptionalBool(query['hasReceipt']),
    source: query['source'] as ExpenseSource | undefined,
    page,
    limit: Math.min(limit, 100),
    sort,
    order,
  };
};
