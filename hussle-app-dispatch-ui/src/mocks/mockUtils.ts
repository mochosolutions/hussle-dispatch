export const BASE = '*/api/v1';

export const defaultMeta = (total: number, page = 1, limit = 20) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasMore: page * limit < total,
});
