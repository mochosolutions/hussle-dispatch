import type { NextFunction, Request, Response } from 'express';
import { CustomError } from '@mocho/common';
import {
  ActiveLoadsConflictError,
  AssignmentValidationError,
  MissingEstimatedHoursError,
  SeatLimitReachedError,
} from '@/shared/errors';
import { logger } from '@/shared/utils/logger';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof SeatLimitReachedError) {
    logger.warn('Handled error', {
      type: error.constructor.name,
      statusCode: error.statusCode,
      message: error.message,
    });
    res.status(error.statusCode).json({
      errors: error.serializeErrors(),
      resourceType: error.resourceType,
      limit: error.limit,
    });
    return;
  }

  if (error instanceof ActiveLoadsConflictError) {
    logger.warn('Handled error', {
      type: error.constructor.name,
      statusCode: error.statusCode,
      message: error.message,
    });
    res.status(error.statusCode).json({
      errors: error.serializeErrors(),
      blockingLoadIds: error.blockingLoadIds,
    });
    return;
  }

  if (error instanceof AssignmentValidationError) {
    logger.warn('Handled error', {
      type: error.constructor.name,
      statusCode: error.statusCode,
      message: error.message,
    });
    res.status(error.statusCode).json({
      errors: error.serializeErrors(),
      blockers: error.blockers,
    });
    return;
  }

  if (error instanceof MissingEstimatedHoursError) {
    logger.warn('Handled error', {
      type: error.constructor.name,
      statusCode: error.statusCode,
      message: error.message,
    });
    res.status(error.statusCode).json({
      errors: [
        {
          code: error.code,
          message: error.message,
          loads: error.loads,
          loadIds: error.loadIds,
        },
      ],
    });
    return;
  }

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

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ errors: [{ message: 'Malformed JSON in request body' }] });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error('Unhandled error', { message, stack });

  res.status(500).json({
    errors: [{ message: 'An unexpected error occurred.' }],
  });
};
