import { success, paginated, buildErrorResponse, buildPaginationMeta } from '../responseEnvelope';
import { NotFoundError, ValidationError } from '../errors';

describe('success', () => {
  it('wraps data in a { data } envelope', () => {
    const result = success({ id: '1', name: 'Test' });
    expect(result).toEqual({ data: { id: '1', name: 'Test' } });
  });

  it('works with primitive values', () => {
    expect(success(42)).toEqual({ data: 42 });
    expect(success(null)).toEqual({ data: null });
  });

  it('works with arrays', () => {
    expect(success([1, 2, 3])).toEqual({ data: [1, 2, 3] });
  });
});

describe('paginated', () => {
  it('wraps data and meta in the correct envelope shape', () => {
    const meta = { page: 1, limit: 25, total: 50, totalPages: 2, hasMore: true };
    const result = paginated([{ id: '1' }], meta);
    expect(result).toEqual({ data: [{ id: '1' }], meta });
  });

  it('works with an empty data array', () => {
    const meta = { page: 1, limit: 25, total: 0, totalPages: 0, hasMore: false };
    const result = paginated([], meta);
    expect(result).toEqual({ data: [], meta });
  });
});

describe('buildPaginationMeta', () => {
  it('calculates totalPages and hasMore correctly', () => {
    const meta = buildPaginationMeta(50, 1, 25);
    expect(meta).toEqual({ page: 1, limit: 25, total: 50, totalPages: 2, hasMore: true });
  });

  it('hasMore is false on the last page', () => {
    const meta = buildPaginationMeta(50, 2, 25);
    expect(meta.hasMore).toBe(false);
  });

  it('handles total of zero', () => {
    const meta = buildPaginationMeta(0, 1, 25);
    expect(meta.totalPages).toBe(0);
    expect(meta.hasMore).toBe(false);
  });
});

describe('buildErrorResponse', () => {
  it('builds error envelope from a NotFoundError', () => {
    const err = new NotFoundError('Something went wrong');
    const result = buildErrorResponse(err);
    expect(result).toEqual({
      errors: [{ message: 'Something went wrong' }],
    });
  });

  it('includes individual detail messages when error has details (ValidationError)', () => {
    const err = new ValidationError('Invalid input', ['field is required', 'email is invalid']);
    const result = buildErrorResponse(err);
    expect(result).toEqual({
      errors: [
        { message: 'field is required' },
        { message: 'email is invalid' },
      ],
    });
  });

  it('uses main message when ValidationError has empty details array', () => {
    const err = new ValidationError('Invalid input');
    const result = buildErrorResponse(err);
    expect(result.errors).toEqual([{ message: 'Invalid input' }]);
  });
});
