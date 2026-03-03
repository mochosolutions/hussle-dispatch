import { logger } from '@/shared/utils/logger';

export const revokeSessionRedis = async (
  { sessionId, refreshToken }: { sessionId: string; refreshToken: string },
  { redisClient }: { redisClient: any }
): Promise<any | null> => {
  const sessionKey = `session:refresh:${sessionId}`;
  const refreshKey = `refresh:${refreshToken}`;

  try {
    const rawSession = await redisClient.get(sessionKey);
    if (!rawSession) {
      logger.error('Session not found for revocation');
      return null;
    }

    const session = JSON.parse(rawSession);
    session.isRevoked = true;

    // Store the revoked session with short TTL for audit trace
    await redisClient.set(sessionKey, JSON.stringify(session), 'EX', 60);

    // Remove refresh token mapping
    if (refreshToken) {
      await redisClient.del(refreshKey);
    }

    // Optionally delete the session key entirely
    await redisClient.del(sessionKey);

    // Remove activeSession key if it still points to this sessionId
    const activeSessionKey = `activeSession:${session.userId}:${session.organizationId}`;
    const activeSessionId = await redisClient.get(activeSessionKey);

    if (activeSessionId === sessionId) {
      await redisClient.del(activeSessionKey);
    }

    return session;
  } catch (error) {
    logger.error('Failed to revoke session', { error });
    return null;
  }
};
