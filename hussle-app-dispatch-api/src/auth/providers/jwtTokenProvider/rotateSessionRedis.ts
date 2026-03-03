import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/shared/utils/logger';
import { REFRESH_TTL_SECONDS } from '../../constants';
import type { CreateSessionResult } from '../../types/tokenProvider';
import { generateAccessToken, hashToken, verifyToken } from './tokenHelpers';

interface RotateSessionInput {
  refreshToken: string;
  singleSession?: boolean;
}

export const rotateSessionRedis = async (
  data: RotateSessionInput,
  { redisClient }: { redisClient: any }
): Promise<CreateSessionResult | null> => {
  logger.info('rotateSessionRedis called');
  const { refreshToken, singleSession } = data;

  const refreshTokenKey = `refresh:${refreshToken}`;
  logger.info('Looking up refresh token key');
  const sessionKey = await redisClient.get(refreshTokenKey);

  if (!sessionKey) {
    logger.error('[rotateSession] No sessionKey found for refresh token');
    return null;
  }

  logger.info('Session key retrieved from Redis');
  const sessionRaw = await redisClient.get(sessionKey);

  logger.info('Session raw data retrieved from Redis');

  if (!sessionRaw) {
    logger.error('Refresh session not found');
    return null;
  }

  // potentially remove this
  const session = JSON.parse(sessionRaw);
  const isValid = verifyToken(refreshToken, session.refreshTokenHash);

  if (!isValid || session.isRevoked) {
    logger.error('Refresh token is invalid or session is revoked');
    return null;
  }

  logger.info('Rotating session', { sessionId: session.sessionId });
  // Revoke the old session
  await redisClient.del(sessionKey);
  await redisClient.del(refreshTokenKey);
  await redisClient.del(`session:index:${session.sessionId}`);

  // Create a new session
  const newRefreshToken = uuidv4();
  const newSessionId = uuidv4();
  const newRefreshHash = hashToken(newRefreshToken);

  const newSessionKey = `session:refresh:${newSessionId}`;
  const newRefreshKey = `refresh:${newRefreshToken}`;
  const sessionIndexKey = `session:index:${newSessionId}`;
  const activeSessionKey = `activeSession:${session.userId}:${session.organizationId}`;

  const newSessionData = {
    ...session,
    refreshTokenHash: newRefreshHash,
    isRevoked: false,
    issuedAt: Date.now(),
    sessionId: newSessionId,
  };

  await redisClient.set(newSessionKey, JSON.stringify(newSessionData), 'EX', REFRESH_TTL_SECONDS);
  await redisClient.set(newRefreshKey, newSessionKey, 'EX', REFRESH_TTL_SECONDS);
  await redisClient.set(sessionIndexKey, newRefreshToken, 'EX', REFRESH_TTL_SECONDS);

  if (singleSession) {
    await redisClient.set(activeSessionKey, newSessionId, 'EX', REFRESH_TTL_SECONDS);
  }
  const accessToken = generateAccessToken({
    userId: session.userId,
    organizationId: session.organizationId,
    orgSlug: session.orgSlug,
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
