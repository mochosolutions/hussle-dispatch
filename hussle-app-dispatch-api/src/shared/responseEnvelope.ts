import type { Response } from 'express';
import type { CustomError } from '@mocho/common';

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
  errors: { message: string; field?: string }[];
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

export const success = <T>(data: T): SingleResponse<T> => ({ data });

export const paginated = <T>(data: T[], meta: PaginationMeta): ListResponse<T> => ({
  data,
  meta,
});

export const buildErrorResponse = (error: CustomError): ErrorResponse => ({
  errors: error.serializeErrors(),
});
