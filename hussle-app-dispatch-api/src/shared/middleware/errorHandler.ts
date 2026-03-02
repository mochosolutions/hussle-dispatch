import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.statusCode === 400 && 'details' in error
          ? { details: (error as { details: string[] }).details }
          : {}),
      },
    });
    return;
  }

  // Unknown error — do not leak internals
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
};
