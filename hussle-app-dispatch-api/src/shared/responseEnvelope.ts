import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SingleResponse<T> {
  data: T;
}

export interface ListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string[];
  };
}

export const sendSingle = <T>(res: Response, data: T, statusCode = 200): void => {
  const body: SingleResponse<T> = { data };
  res.status(statusCode).json(body);
};

export const sendList = <T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  statusCode = 200,
): void => {
  const body: ListResponse<T> = { data, meta };
  res.status(statusCode).json(body);
};

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
};
