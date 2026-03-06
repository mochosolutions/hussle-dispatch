import type Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/shared/utils/logger';
import { REFRESH_TTL_SECONDS, JWT_EXPIRES_IN, getJwtSecret } from '../../constants';
import type {
  CreateSessionInput,
  CreateSessionResult,
  SessionData,
} from '../../types/tokenProvider';
import { hashToken } from './tokenHelpers';

export const createSessionRedis = async (
  data: CreateSessionInput & { ipAddress?: string; userAgent?: string; singleSession?: boolean },
  { redisClient }: { redisClient: Redis }
): Promise<CreateSessionResult> => {
  const {
    userId,
    organizationId,
    orgSlug,
    orgStatus,
    orgSubscriptionTier,
    role,
    membershipId,
    // ipAddress,
    // userAgent,
    singleSession = false,
  } = data;

  const sessionId = uuidv4(); // new session ID
  const refreshToken = uuidv4();
  const refreshTokenHash = hashToken(refreshToken);

  const sessionKey = `session:refresh:${sessionId}`;
  const refreshIndexKey = `refresh:${refreshToken}`;
  const sessionIndexKey = `session:index:${sessionId}`;
  const activeSessionKey = `activeSession:${userId}:${organizationId}`;

  // Optional: enforce one session per user/org
  if (singleSession) {
    const existingSessionId = await redisClient.get(activeSessionKey);
    if (existingSessionId) {
      const existingSessionKey = `session:refresh:${existingSessionId}`;
      const rawSession = await redisClient.get(existingSessionKey);

      if (rawSession) {
        const session = JSON.parse(rawSession);
        session.isRevoked = true;

        // Keep briefly for audit/debugging
        await redisClient.set(existingSessionKey, JSON.stringify(session), 'EX', 60);

        // Delete the old session entry
        await redisClient.del(existingSessionKey);

        // Try deleting old refresh index (if tracked)
        const oldRefreshToken = await redisClient.get(`session:index:${existingSessionId}`);
        if (oldRefreshToken) {
          await redisClient.del(`refresh:${oldRefreshToken}`);
          await redisClient.del(`session:index:${existingSessionId}`);
        }

        logger.info('[auth] Revoked previous session', {
          sessionId: existingSessionId,
          userId,
          organizationId,
        });
      }
    }
  }

  // Session payload to be stored in Redis
  const sessionData: SessionData = {
    sessionId,
    userId,
    organizationId,
    orgSlug,
    orgStatus,
    orgSubscriptionTier,
    membershipId,
    role,
    refreshTokenHash,
    isRevoked: false,
    issuedAt: Date.now(),
    // ipAddress,
    // userAgent
  };

  // Store session + refresh mappings

  await redisClient.set(refreshIndexKey, sessionKey, 'EX', REFRESH_TTL_SECONDS);
  await redisClient.set(sessionIndexKey, refreshToken, 'EX', REFRESH_TTL_SECONDS);
  await redisClient.set(activeSessionKey, sessionId, 'EX', REFRESH_TTL_SECONDS);
  await redisClient.set(sessionKey, JSON.stringify(sessionData), 'EX', REFRESH_TTL_SECONDS);

  // Issue short-lived access token
  const accessToken = jwt.sign(
    {
      userId,
      organizationId,
      orgSlug,
      membershipId,
      role,
      sessionId,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    accessToken,
    refreshToken,
  };
};
