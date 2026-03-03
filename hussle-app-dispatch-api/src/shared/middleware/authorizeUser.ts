import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/shared/errors/authError';

const claimMatches = (actual: unknown, expected: unknown): boolean => {
  if (Array.isArray(actual) && Array.isArray(expected)) {
    return actual.some((v: unknown) => (expected as unknown[]).includes(v));
  }
  if (Array.isArray(actual)) {
    return actual.includes(expected);
  }
  if (Array.isArray(expected)) {
    return (expected as unknown[]).includes(actual);
  }
  return actual === expected;
};

export const authorizeUser =
  (requiredClaims: Record<string, unknown>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const { user } = req;

    if (!user) {
      next(new UnauthorizedError('User is not authenticated'));
      return;
    }

    const userRecord: Record<string, unknown> = { ...user };

    for (const [claim, expectedValue] of Object.entries(requiredClaims)) {
      const actualValue = userRecord[claim];

      if (actualValue === undefined) {
        next(new UnauthorizedError(`Missing required claim: ${claim}`));
        return;
      }

      if (!claimMatches(actualValue, expectedValue)) {
        const fmt = (v: unknown): string =>
          Array.isArray(v) ? v.join(',') : `${v as string | number}`;
        next(
          new UnauthorizedError(
            `Claim ${claim}: expected ${fmt(expectedValue)}, got ${fmt(actualValue)}`,
          ),
        );
        return;
      }
    }

    next();
  };
