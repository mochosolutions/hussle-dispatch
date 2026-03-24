import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type Redis from 'ioredis';
import { logger } from '@/shared/utils/logger';
import { OrganizationStatus } from '@/auth/constants/enums';

export interface AuthPayload {
  userId: string;
  email?: string;
  organizationId: string;
  orgSlug: string;
  orgStatus: string;
  membershipId: string;
  role: string;
  refreshTokenHash: string;
  permissionsVersion: number;
  sessionId: string;
}

const resolveJwtSecret = (): string => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

export const createAppAuthMiddleware = (options: { redis: Redis; jwtSecret?: string }) => {
  const { redis: redisClient, jwtSecret = resolveJwtSecret() } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.accessToken as string | undefined;

      logger.debug('Auth middleware: token received', {
        hasToken: Boolean(token),
        correlationId: req.correlationId,
      });

      if (!token) {
        res.status(401).json({ errors: [{ message: 'Missing authentication token' }] });
        return;
      }

      const decoded = jwt.verify(token, jwtSecret) as AuthPayload;
      const { userId, sessionId } = decoded;

      const sessionKey = `session:refresh:${sessionId}`;
      const sessionRaw = await redisClient.get(sessionKey);

      logger.debug('Auth middleware: session lookup', {
        sessionKey,
        sessionExists: Boolean(sessionRaw),
        correlationId: req.correlationId,
      });

      if (!sessionRaw) {
        res.status(401).json({ errors: [{ message: 'Session expired or not found' }] });
        return;
      }

      const session: { isRevoked?: boolean } = JSON.parse(sessionRaw);
      if (session.isRevoked) {
        logger.warn('Auth middleware: revoked session accessed', {
          userId,
          sessionId,
          correlationId: req.correlationId,
        });
        res.status(401).json({ errors: [{ message: 'Session has been revoked' }] });
        return;
      }

      if (decoded.orgStatus !== OrganizationStatus.ACTIVE) {
        res.status(403).json({ errors: [{ message: 'Organization is suspended or inactive' }] });
        return;
      }

      req.user = decoded;
      req.organizationId = decoded.organizationId;
      req.orgSlug = decoded.orgSlug;
      next();
    } catch (err: unknown) {
      logger.error('Auth middleware: token validation failed', {
        error: err instanceof Error ? err.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      res.status(401).json({ errors: [{ message: 'Invalid app token' }] });
    }
  };
};

/**
 * Pre-configured appAuth middleware using the singleton Redis client.
 * Lazy-initialized to avoid crashing at import time when env vars are missing
 * (e.g., during tests that don't need auth).
 */
let cachedMiddleware: ((req: Request, res: Response, next: NextFunction) => Promise<void>) | null =
  null;

const getAppAuth = async (): Promise<
  (req: Request, res: Response, next: NextFunction) => Promise<void>
> => {
  if (!cachedMiddleware) {
    const { redisClient } = await import('@/shared/redisClient');
    cachedMiddleware = createAppAuthMiddleware({ redis: redisClient });
  }
  return cachedMiddleware;
};

export const appAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const middleware = await getAppAuth();
  return middleware(req, res, next);
};
