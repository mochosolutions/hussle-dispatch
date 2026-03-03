import type { SessionData } from '../../types/tokenProvider';
import { ITokenProvider, TokenProviderDeps } from '../../types/tokenProvider';

export interface GetOrgSessionsInput {
  organizationId: string;
}

export interface OrgSessionWithRefreshToken {
  sessionKey: string;
  refreshToken: string;
  sessionData: SessionData;
}

export interface GetOrgSessionsDeps {
  redisClient: {
    keys: (pattern: string) => Promise<string[]>;
    get: (key: string) => Promise<string | null>;
  };
}

export const getAllSessionsByOrgId = async (orgId: string, redisClient: any): Promise<string[]> => {
  const keys = await redisClient.keys('session:*');
  const matchingSessionIds: string[] = [];
  for (const key of keys) {
    const raw = await redisClient.get(key);
    if (!raw) {
      continue;
    }

    const session = JSON.parse(raw);
    if (session.organizationId === orgId) {
      const sessionId = key.replace('session:', '');
      matchingSessionIds.push(sessionId);
    }
  }
  return matchingSessionIds;
};

export const getOrgSessionsWithRefreshTokens = async (
  organizationId: string,
  { redisClient }: GetOrgSessionsDeps
): Promise<OrgSessionWithRefreshToken[]> => {
  // Find all session keys
  const sessionKeys = await redisClient.keys('session:refresh:*');
  const refreshKeys = await redisClient.keys('refresh:*');
  const result: OrgSessionWithRefreshToken[] = [];

  // Build a map of refreshKey -> sessionKey for fast lookup
  const refreshToSessionMap: Record<string, string> = {};
  for (const refreshKey of refreshKeys) {
    const sessionKey = await redisClient.get(refreshKey);
    if (sessionKey) {
      refreshToSessionMap[sessionKey] = refreshKey.replace('refresh:', '');
    }
  }

  for (const sessionKey of sessionKeys) {
    const raw = await redisClient.get(sessionKey);
    if (!raw) {
      continue;
    }

    const sessionData: SessionData = JSON.parse(raw);
    if (sessionData.organizationId === organizationId) {
      const refreshToken = refreshToSessionMap[sessionKey] ?? '';
      result.push({ sessionKey, refreshToken, sessionData });
    }
  }

  return result;
};
