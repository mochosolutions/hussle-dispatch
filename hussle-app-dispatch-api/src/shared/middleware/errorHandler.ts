import type { NextFunction, Request, Response } from 'express';
import { CustomError } from '@mocho/common';
import { logger } from '@/shared/utils/logger';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof CustomError) {
    logger.warn('Handled error', {
      type: error.constructor.name,
      statusCode: error.statusCode,
      message: error.message,
    });
    res.status(error.statusCode).json({
      errors: error.serializeErrors(),
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error('Unhandled error', { message, stack });

  res.status(500).json({
    errors: [{ message: 'An unexpected error occurred.' }],
  });
};
