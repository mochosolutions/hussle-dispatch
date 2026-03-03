import { logger } from '@/shared/utils/logger';
import type { SessionData } from '../../types/tokenProvider';
import { hashToken, verifyToken } from './tokenHelpers';

interface VerifyRefreshTokenInput {
  refreshToken: string;
}

interface VerifyRefreshTokenDeps {
  redisClient: any;
}

export const verifyRefreshToken = async (
  { refreshToken }: VerifyRefreshTokenInput,
  { redisClient }: VerifyRefreshTokenDeps
): Promise<SessionData | null> => {
  const refreshKey = `refresh:${refreshToken}`;

  // Step 1: Resolve session key from refresh token
  const sessionKey = await redisClient.get(refreshKey);
  if (!sessionKey) {
    logger.warn('No session key found for refresh token');
    return null;
  }

  // Step 2: Fetch session data
  const rawSession = await redisClient.get(sessionKey);
  if (!rawSession) {
    logger.warn('No session found for session key');
    return null;
  }

  const session: SessionData = JSON.parse(rawSession);

  // Step 3: Check if session is revoked
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
