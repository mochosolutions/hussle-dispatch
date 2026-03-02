import type { Request } from 'express';
import { buildPaginationMeta } from './responseEnvelope';
import type { PaginationMeta } from './responseEnvelope';

export const PAGINATION_DEFAULTS = Object.freeze({
  PAGE: 1,
  LIMIT: 25,
  MAX_LIMIT: 100,
  SORT: 'createdAt',
  ORDER: 'desc',
} as const);

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  page: number;
  limit: number;
  sort: string;
  order: SortOrder;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Extracts and validates pagination parameters from an Express query string.
 * Clamps limit to [1, 100], defaults page=1, limit=25, sort='createdAt', order='desc'.
 */
export const parsePaginationParams = (query: Request['query']): PaginationParams => {
  const rawPage = Number(query['page']);
  const rawLimit = Number(query['limit']);
  const rawSort = typeof query['sort'] === 'string' ? query['sort'] : PAGINATION_DEFAULTS.SORT;
  const rawOrder = query['order'];

  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : PAGINATION_DEFAULTS.PAGE;
  const unclamped =
    Number.isInteger(rawLimit) && rawLimit >= 1 ? rawLimit : PAGINATION_DEFAULTS.LIMIT;
  const limit = Math.min(unclamped, PAGINATION_DEFAULTS.MAX_LIMIT);
  const sort = rawSort.length > 0 ? rawSort : PAGINATION_DEFAULTS.SORT;
  const order: SortOrder =
    rawOrder === 'asc' || rawOrder === 'desc' ? rawOrder : PAGINATION_DEFAULTS.ORDER;

  return { page, limit, sort, order };
};

export interface PrismaModelDelegate<T> {
  findMany(args: {
    skip: number;
    take: number;
    orderBy: Record<string, SortOrder>;
  }): Promise<T[]>;
  count(): Promise<number>;
}

/**
 * Runs a Prisma findMany + count with pagination parameters and returns a
 * paginated result with the standard meta envelope.
 *
 * The caller supplies a factory that produces the findMany and count calls so
 * additional where/include clauses can be forwarded correctly.
 */
export const paginateQuery = async <T>(
  params: PaginationParams,
  runner: {
    findMany(args: { skip: number; take: number; orderBy: Record<string, SortOrder> }): Promise<T[]>;
    count(): Promise<number>;
  },
): Promise<PaginatedResult<T>> => {
  const { page, limit, sort, order } = params;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    runner.findMany({ skip, take: limit, orderBy: { [sort]: order } }),
    runner.count(),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return { data, meta };
};
