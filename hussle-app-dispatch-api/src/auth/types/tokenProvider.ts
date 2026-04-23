// tokenProvider.ts
import Redis from 'ioredis';
export interface TokenPayload {
  userId: string;
  orgId: string;
  userRole: string;
  orgRole: string;
  subscriptionTier: string;
}

export interface CreateSessionInput {
  userId: string;
  organizationId: string;
  orgSlug: string;
  orgSubscriptionTier: string;
  orgStatus: string;
  membershipId: string;
  role: string;
  ipAddress?: string;
  userAgent?: string;
  singleSession?: boolean;
  permissionsVersion?: number;
}

export interface CreateSessionResult {
  accessToken: string;
  refreshToken: string;
}

export interface TokenProviderDeps {
  client: Redis;
  singleSession?: boolean;
}

export interface RefreshTokenInput {
  userId: string;
  refreshToken: string;
}

export interface VerifyRefreshTokenInput {
  // userId: string;
  refreshToken: string;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  organizationId: string;
  orgSlug: string;
  orgStatus: string;
  orgSubscriptionTier: string;
  membershipId: string;
  role: string;
  permissionsVersion: number;
  contextHash?: string;
  isRevoked: boolean;
  refreshTokenHash: string;
  issuedAt: number;
}

export interface SwitchOrgInput {
  accessToken: string;
  organizationId: string;
}

export interface VerifyAccessTokenResult {
  userId: string;
  tokenId: string;
}

export interface OrgSessionWithRefreshToken {
  sessionKey: string;
  refreshToken: string;
  sessionData: SessionData;
}

export interface DeleteOrgSessionsInput {
  sessions: OrgSessionWithRefreshToken[];
}

export interface ITokenProvider {
  createSession(input: CreateSessionInput): Promise<CreateSessionResult>;
  refreshToken(input: { refreshToken: string; ipAddress?: string; userAgent?: string }): Promise<CreateSessionResult | null>;
  verifyAccessToken(token: string): Promise<VerifyAccessTokenResult | null>;
  revokeSession(input: { sessionId: string; refreshToken: string }): Promise<void>;
  revokeUserOrgSessions(input: { userId: string; organizationId: string }): Promise<number>;
  getSessionById(sessionId: string): Promise<SessionData | null>;
  getOrgSessions(orgId: string): Promise<OrgSessionWithRefreshToken[]>;
  deleteOrgSessions(input: DeleteOrgSessionsInput): Promise<void>;
  verifyRefreshToken(args: VerifyRefreshTokenInput): Promise<SessionData | null>;
}
