import type { SessionData } from '../../types/tokenProvider';

export interface RevokeUserOrgSessionsInput {
  userId: string;
  organizationId: string;
}

export interface RevokeUserOrgSessionsDeps {
  redisClient: {
    keys: (pattern: string) => Promise<string[]>;
    get: (key: string) => Promise<string | null>;
    del: (key: string) => Promise<number>;
  };
}

/**
 * Revokes all sessions for a specific user in a specific organization.
 *
 * Use this when:
 * - A membership is suspended or deactivated
 * - A user is removed from an organization
 * - An admin needs to force logout a user from their org
 *
 * This ensures that when membership status changes, the user is immediately
 * logged out without needing to wait for token expiry.
 *
 * @param input - userId and organizationId to revoke sessions for
 * @param deps - Redis client dependency
 * @returns Number of sessions revoked
 */
export const revokeUserOrgSessions = async (
  { userId, organizationId }: RevokeUserOrgSessionsInput,
  { redisClient }: RevokeUserOrgSessionsDeps
): Promise<number> => {
  // Find all session keys
  const sessionKeys = await redisClient.keys('session:refresh:*');
  let revokedCount = 0;

  for (const sessionKey of sessionKeys) {
    const raw = await redisClient.get(sessionKey);
    if (!raw) {
      continue;
    }

    const sessionData: SessionData = JSON.parse(raw);

    // Match both userId AND organizationId
    if (sessionData.userId === userId && sessionData.organizationId === organizationId) {
      // Delete the session
      await redisClient.del(sessionKey);

      // Delete the activeSession key if it exists
      const activeSessionKey = `activeSession:${userId}:${organizationId}`;
      await redisClient.del(activeSessionKey);

      // Note: We don't have the refresh token here, but deleting the session
      // is sufficient - the refresh token lookup will fail when the session is gone

      revokedCount++;
    }
  }

  return revokedCount;
};
