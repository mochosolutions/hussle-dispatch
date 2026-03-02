import type { Response } from 'express';
import type { AppError } from './errors';

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

/**
 * Builds a plain success envelope for a single resource.
 * Use when you need the shaped object directly (e.g., tests, non-Express contexts).
 */
export const success = <T>(data: T): SingleResponse<T> => ({ data });

/**
 * Builds a plain paginated envelope for a list resource.
 */
export const paginated = <T>(data: T[], meta: PaginationMeta): ListResponse<T> => ({
  data,
  meta,
});

const hasDetails = (err: AppError): err is AppError & { details: string[] } =>
  'details' in err && Array.isArray((err as { details: unknown }).details);

/**
 * Builds a plain error envelope from an AppError.
 */
export const buildErrorResponse = (appError: AppError): ErrorResponse => {
  const errorBody: ErrorResponse['error'] = {
    code: appError.code,
    message: appError.message,
  };
  if (hasDetails(appError)) {
    errorBody.details = appError.details;
  }
  return { error: errorBody };
};
