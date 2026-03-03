import { logger } from '@/shared/utils/logger';
import type { SessionData } from '../../types/tokenProvider';

export const getSessionById = async (
  sessionId: string,
  { redisClient }: { redisClient: any }
): Promise<SessionData | null> => {
  const sessionKey = `session:refresh:${sessionId}`;

  try {
    const raw = await redisClient.get(sessionKey);
    if (!raw) {
      logger.warn(`No session found for sessionId: ${sessionId}`);
      return null;
    }

    const session: SessionData = JSON.parse(raw);

    // Validate session schema
    if (!session.userId || !session.organizationId || !session.membershipId) {
      logger.error('Malformed session data', { sessionId });
      return null;
    }

    return session;
  } catch (err) {
    logger.error(`Error retrieving session for sessionId: ${sessionId}`, { error: err });
    return null;
  }
};
