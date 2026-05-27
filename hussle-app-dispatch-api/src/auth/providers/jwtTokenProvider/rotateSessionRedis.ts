import crypto from 'crypto';
import type Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/shared/utils/logger';
import { getRefreshTtlSeconds, ROTATION_GRACE_TTL_SECONDS } from '../../constants';
import type { CreateSessionResult, SessionData } from '../../types/tokenProvider';
import { generateAccessToken, hashToken, verifyToken } from './tokenHelpers';

const computeContextHash = (ipAddress?: string, userAgent?: string): string | undefined => {
  if (!ipAddress && !userAgent) {
    return undefined;
  }
  return crypto
    .createHash('sha256')
    .update(`${ipAddress ?? ''}:${userAgent ?? ''}`)
    .digest('hex');
};

interface RotateSessionInput {
  refreshToken: string;
  singleSession?: boolean;
  ipAddress?: string;
  userAgent?: string;
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
  typeof (value as { newSessionKey?: unknown }).newSessionKey === 'string' &&
  typeof (value as { newRefreshToken?: unknown }).newRefreshToken === 'string';

const tryParseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const rotateSessionRedis = async (
  data: RotateSessionInput,
  { redisClient }: { redisClient: Redis }
): Promise<CreateSessionResult | null> => {
  logger.info('rotateSessionRedis called');
  const { refreshToken, singleSession } = data;

  const refreshTokenKey = `refresh:${refreshToken}`;
  logger.info('Looking up refresh token key');
  const raw = await redisClient.get(refreshTokenKey);

  if (!raw) {
    logger.error('[rotateSession] No value found for refresh token');
    return null;
  }

  // Grace branch: this refresh token was already rotated; replay returns the
  // same new tokens that were issued by the original rotation. This lets
  // concurrent requests carrying the same old cookie succeed once.
  const parsed = tryParseJson(raw);
  if (isGracePacket(parsed)) {
    logger.info('[rotateSession] Grace packet detected — replaying rotation');
    const newSessionRaw = await redisClient.get(parsed.newSessionKey);
    if (!newSessionRaw) {
      logger.error('[rotateSession] Grace packet references missing session');
      return null;
    }
    const newSession: SessionData = JSON.parse(newSessionRaw);
    const accessToken = generateAccessToken({
      userId: newSession.userId,
      organizationId: newSession.organizationId,
      orgSlug: newSession.orgSlug,
      orgStatus: newSession.orgStatus,
      membershipId: newSession.membershipId,
      role: newSession.role,
      permissionsVersion: newSession.permissionsVersion,
      sessionId: newSession.sessionId,
    });
    return {
      accessToken,
      refreshToken: parsed.newRefreshToken,
    };
  }

  // Legacy branch: raw is a session-key pointer string.
  const sessionKey = raw;
  logger.info('Session key retrieved from Redis');
  const sessionRaw = await redisClient.get(sessionKey);

  logger.info('Session raw data retrieved from Redis');

  if (!sessionRaw) {
    logger.error('Refresh session not found');
    return null;
  }

  const session: SessionData = JSON.parse(sessionRaw);
  const isValid = verifyToken(refreshToken, session.refreshTokenHash);

  if (!isValid || session.isRevoked) {
    logger.error('Refresh token is invalid or session is revoked');
    return null;
  }

  if (session.contextHash && data.ipAddress) {
    const currentHash = computeContextHash(data.ipAddress, data.userAgent);
    if (currentHash && session.contextHash !== currentHash) {
      logger.warn('Refresh token context mismatch — possible token theft', {
        sessionId: session.sessionId,
        userId: session.userId,
      });
      return null;
    }
  }

  logger.info('Rotating session', { sessionId: session.sessionId });

  const rememberMe = session.rememberMe === true;
  const refreshTtlSeconds = getRefreshTtlSeconds(rememberMe);

  // Create a new session
  const newRefreshToken = uuidv4();
  const newSessionId = uuidv4();
  const newRefreshHash = hashToken(newRefreshToken);

  const newSessionKey = `session:refresh:${newSessionId}`;
  const newRefreshKey = `refresh:${newRefreshToken}`;
  const sessionIndexKey = `session:index:${newSessionId}`;
  const activeSessionKey = `activeSession:${session.userId}:${session.organizationId}`;

  const newSessionData: SessionData = {
    ...session,
    refreshTokenHash: newRefreshHash,
    isRevoked: false,
    issuedAt: Date.now(),
    sessionId: newSessionId,
    rememberMe,
  };

  await redisClient.set(newSessionKey, JSON.stringify(newSessionData), 'EX', refreshTtlSeconds);
  await redisClient.set(newRefreshKey, newSessionKey, 'EX', refreshTtlSeconds);
  await redisClient.set(sessionIndexKey, newRefreshToken, 'EX', refreshTtlSeconds);

  if (singleSession) {
    await redisClient.set(activeSessionKey, newSessionId, 'EX', refreshTtlSeconds);
  }

  // Revoke the OLD session blob and its index, but rewrite the OLD refresh
  // pointer as a grace packet so concurrent replays of the same old cookie
  // return the same new tokens within the grace window.
  const gracePacket: GracePacket = {
    kind: 'grace',
    newSessionKey,
    newRefreshToken,
  };
  await redisClient.set(
    refreshTokenKey,
    JSON.stringify(gracePacket),
    'EX',
    ROTATION_GRACE_TTL_SECONDS
  );
  await redisClient.del(sessionKey);
  await redisClient.del(`session:index:${session.sessionId}`);

  const accessToken = generateAccessToken({
    userId: session.userId,
    organizationId: session.organizationId,
    orgSlug: session.orgSlug,
    orgStatus: session.orgStatus,
    membershipId: session.membershipId,
    role: session.role,
    permissionsVersion: session.permissionsVersion,
    sessionId: newSessionId,
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};
