import { logger } from '@/shared/utils/logger';
import type { SessionData } from '../../types/tokenProvider';
import { ITokenProvider, TokenProviderDeps } from '../../types/tokenProvider';

export interface OrgSessionWithRefreshToken {
  sessionKey: string;
  refreshToken: string;
  sessionData: SessionData;
}
export interface DeleteOrgSessionsInput {
  sessions: OrgSessionWithRefreshToken[];
}

export interface DeleteOrgSessionsDeps {
  redisClient: {
    del: (key: string) => Promise<number>;
  };
}

/**
 * Deletes all session and refresh token keys for the provided sessions.
 * @param input - List of sessions with sessionKey and refreshToken.
 * @param deps - Injected dependencies (redisClient).
 */
export const deleteOrgSessions = async (
  { sessions }: DeleteOrgSessionsInput,
  { redisClient }: DeleteOrgSessionsDeps
): Promise<void> => {
  logger.info('Deleting sessions', { count: sessions.length });

  for (const { sessionKey, refreshToken } of sessions) {
    if (sessionKey) {
      await redisClient.del(sessionKey);
    }
    if (refreshToken) {
      await redisClient.del(`refresh:${refreshToken}`);
    }
  }
};
