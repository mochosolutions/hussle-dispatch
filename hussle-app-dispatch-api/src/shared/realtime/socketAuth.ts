import jwt from 'jsonwebtoken';
import type { Redis } from 'ioredis';
import type { Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';

import { env } from '@/config/env';
import type { AuthPayload } from '@/shared/middleware/authenticateUser';
import type { Logger } from '@/shared/utils/logger';

/**
 * Verified per-socket identity, derived ONLY from the session — never from
 * client-supplied handshake data (query params, auth payload, etc.).
 */
export interface SocketSessionData {
  userId: string;
  organizationId: string;
  role: string;
}

interface SocketAuthDeps {
  redis: Redis;
  logger: Logger;
}

const COOKIE_NAME = 'accessToken';

const extractAccessToken = (cookieHeader: string | undefined): string | undefined => {
  if (cookieHeader === undefined || cookieHeader === '') {
    return undefined;
  }
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (match === undefined) {
    return undefined;
  }
  return decodeURIComponent(match.slice(COOKIE_NAME.length + 1));
};

/**
 * socket.io handshake middleware mirroring `authenticateUser`'s cookie-JWT flow:
 * parse the `accessToken` cookie, `jwt.verify` it, then confirm the Redis
 * session at `session:refresh:${sessionId}` exists and is not revoked.
 *
 * On success it sets `socket.data` to the verified `{ userId, organizationId,
 * role }`. The room a socket may join is derived from this server-trusted data
 * only; client-sent org/room values are never honored. Any failure rejects the
 * connection with `unauthorized`.
 */
export const createSocketAuthMiddleware =
  (deps: SocketAuthDeps) =>
  async (socket: Socket, next: (err?: ExtendedError) => void): Promise<void> => {
    try {
      const token = extractAccessToken(socket.handshake.headers.cookie);

      if (token === undefined) {
        next(new Error('unauthorized'));
        return;
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      const { sessionId } = decoded;

      const sessionRaw = await deps.redis.get(`session:refresh:${sessionId}`);
      if (sessionRaw === null) {
        next(new Error('unauthorized'));
        return;
      }

      const session: { isRevoked?: boolean } = JSON.parse(sessionRaw);
      if (session.isRevoked === true) {
        next(new Error('unauthorized'));
        return;
      }

      const data: SocketSessionData = {
        userId: decoded.userId,
        organizationId: decoded.organizationId,
        role: decoded.role,
      };
      socket.data = data;
      next();
    } catch (error: unknown) {
      deps.logger.warn('Socket auth rejected', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(new Error('unauthorized'));
    }
  };
