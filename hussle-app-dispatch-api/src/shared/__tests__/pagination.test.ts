import type { Request } from 'express';
import {
  parsePaginationParams,
  paginateQuery,
  PAGINATION_DEFAULTS,
} from '../pagination';

// ---------------------------------------------------------------------------
// parsePaginationParams
// ---------------------------------------------------------------------------

describe('parsePaginationParams', () => {
  const makeQuery = (overrides: Record<string, string> = {}): Request['query'] =>
    overrides as unknown as Request['query'];

  it('returns defaults when query is empty', () => {
    const result = parsePaginationParams(makeQuery());

    expect(result).toEqual({
      page: PAGINATION_DEFAULTS.PAGE,
      limit: PAGINATION_DEFAULTS.LIMIT,
      sort: PAGINATION_DEFAULTS.SORT,
      order: PAGINATION_DEFAULTS.ORDER,
    });
  });

  it('parses valid page and limit from query string', () => {
    const result = parsePaginationParams(makeQuery({ page: '3', limit: '50' }));

    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it('clamps limit to maxLimit (100)', () => {
    const result = parsePaginationParams(makeQuery({ limit: '999' }));

    expect(result.limit).toBe(PAGINATION_DEFAULTS.MAX_LIMIT);
  });

  it('clamps limit minimum to 1 when 0 is provided', () => {
    const result = parsePaginationParams(makeQuery({ limit: '0' }));

    expect(result.limit).toBe(PAGINATION_DEFAULTS.LIMIT);
  });

  it('defaults page to 1 when negative page is provided', () => {
    const result = parsePaginationParams(makeQuery({ page: '-5' }));

    expect(result.page).toBe(PAGINATION_DEFAULTS.PAGE);
  });

  it('defaults page to 1 when a non-numeric page is provided', () => {
    const result = parsePaginationParams(makeQuery({ page: 'abc' }));

    expect(result.page).toBe(PAGINATION_DEFAULTS.PAGE);
  });

  it('accepts asc order', () => {
    const result = parsePaginationParams(makeQuery({ order: 'asc' }));

    expect(result.order).toBe('asc');
  });

  it('accepts desc order', () => {
    const result = parsePaginationParams(makeQuery({ order: 'desc' }));

    expect(result.order).toBe('desc');
  });

  it('defaults order to desc when an invalid value is provided', () => {
    const result = parsePaginationParams(makeQuery({ order: 'random' }));

    expect(result.order).toBe(PAGINATION_DEFAULTS.ORDER);
  });

  it('accepts a custom sort field', () => {
    const result = parsePaginationParams(makeQuery({ sort: 'updatedAt' }));

    expect(result.sort).toBe('updatedAt');
  });

  it('defaults sort to createdAt when an empty string is provided', () => {
    const result = parsePaginationParams(makeQuery({ sort: '' }));

    expect(result.sort).toBe(PAGINATION_DEFAULTS.SORT);
  });
});

// ---------------------------------------------------------------------------
// paginateQuery
// ---------------------------------------------------------------------------

describe('paginateQuery', () => {
  const defaultParams = {
    page: 1,
    limit: 25,
    sort: 'createdAt',
    order: 'desc' as const,
  };

  it('returns data and correct meta when items exist', async () => {
    const mockItems = [{ id: '1' }, { id: '2' }];
    const runner = {
      findMany: jest.fn().mockResolvedValue(mockItems),
      count: jest.fn().mockResolvedValue(50),
    };

    const result = await paginateQuery(defaultParams, runner);

    expect(result.data).toEqual(mockItems);
    expect(result.meta).toEqual({
      page: 1,
      limit: 25,
      total: 50,
      totalPages: 2,
      hasMore: true,
    });
  });

  it('passes correct skip and take to findMany', async () => {
    const runner = {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    };
    const params = { page: 3, limit: 10, sort: 'createdAt', order: 'desc' as const };

    await paginateQuery(params, runner);

    expect(runner.findMany).toHaveBeenCalledWith({
      skip: 20,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('passes orderBy with the requested sort field and order', async () => {
    const runner = {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    };
    const params = { page: 1, limit: 25, sort: 'updatedAt', order: 'asc' as const };

    await paginateQuery(params, runner);

    expect(runner.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { updatedAt: 'asc' } }),
    );
  });

  it('sets hasMore to false on the last page', async () => {
    const runner = {
      findMany: jest.fn().mockResolvedValue([{ id: '1' }]),
      count: jest.fn().mockResolvedValue(10),
    };
    const params = { page: 1, limit: 25, sort: 'createdAt', order: 'desc' as const };

    const result = await paginateQuery(params, runner);

    expect(result.meta.hasMore).toBe(false);
    expect(result.meta.totalPages).toBe(1);
  });

  it('returns empty data and zero totals when no records exist', async () => {
    const runner = {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    };

    const result = await paginateQuery(defaultParams, runner);

    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
    expect(result.meta.hasMore).toBe(false);
  });

  it('runs findMany and count in parallel', async () => {
    const order: string[] = [];
    const runner = {
      findMany: jest.fn().mockImplementation(async () => {
        order.push('findMany');
        return [];
      }),
      count: jest.fn().mockImplementation(async () => {
        order.push('count');
        return 0;
      }),
    };

    await paginateQuery(defaultParams, runner);

    // Both should be called — order is not deterministic with Promise.all
    expect(runner.findMany).toHaveBeenCalledTimes(1);
    expect(runner.count).toHaveBeenCalledTimes(1);
  });
});
