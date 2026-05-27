import type Redis from 'ioredis';
import { logger } from '@/shared/utils/logger';
import type { SessionData } from '../../types/tokenProvider';
import { verifyToken } from './tokenHelpers';

interface VerifyRefreshTokenInput {
  refreshToken: string;
}

interface VerifyRefreshTokenDeps {
  redisClient: Redis;
}

interface GracePacket {
  kind: 'grace';
  newSessionKey: string;
  newRefreshToken: string;
}

const isGracePacket = (value: unknown): value is GracePacket =>
  typeof value === 'object' &&
  value !== null &&
  (value as { kind?: unknown }).kind === 'grace' &&
  typeof (value as { newSessionKey?: unknown }).newSessionKey === 'string';

const tryParseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const verifyRefreshToken = async (
  { refreshToken }: VerifyRefreshTokenInput,
  { redisClient }: VerifyRefreshTokenDeps
): Promise<SessionData | null> => {
  const refreshKey = `refresh:${refreshToken}`;

  // Step 1: Resolve refresh token key. Two possible shapes:
  //   a) session-key pointer string ("session:refresh:<id>") — normal case
  //   b) grace packet JSON ({ kind: 'grace', newSessionKey, newRefreshToken })
  //      written by rotateSessionRedis when the OLD token gets rotated. The
  //      grace branch means rotation already happened; treat the new session
  //      as the verified target.
  const raw = await redisClient.get(refreshKey);
  if (!raw) {
    logger.warn('No session key found for refresh token');
    return null;
  }

  const parsed = tryParseJson(raw);
  if (isGracePacket(parsed)) {
    // Grace path: load the NEW session and skip the token-hash check (the new
    // token is freshly minted; the OLD token's verifyToken hash wouldn't match
    // anyway since the session blob now stores the new hash).
    const rawNewSession = await redisClient.get(parsed.newSessionKey);
    if (!rawNewSession) {
      logger.warn('Grace packet references missing session');
      return null;
    }
    const newSession: SessionData = JSON.parse(rawNewSession);
    if (newSession.isRevoked) {
      logger.warn('Grace-target session is revoked');
      return null;
    }
    return newSession;
  }

  // Legacy path: raw is the session-key pointer string.
  const sessionKey = raw;
  const rawSession = await redisClient.get(sessionKey);
  if (!rawSession) {
    logger.warn('No session found for session key');
    return null;
  }

  const session: SessionData = JSON.parse(rawSession);

  if (session.isRevoked) {
    logger.warn('Session is revoked');
    return null;
  }

  const isValid = verifyToken(refreshToken, session.refreshTokenHash);
  if (!isValid) {
    logger.warn('Refresh token is invalid');
    return null;
  }

  return session;
};
