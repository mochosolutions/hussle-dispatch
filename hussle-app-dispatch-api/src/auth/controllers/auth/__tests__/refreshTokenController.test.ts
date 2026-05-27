import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import { createRefreshTokenController } from '../refreshTokenController';
import {
  REFRESH_TTL_BASE_SECONDS,
  REFRESH_TTL_EXTENDED_SECONDS,
} from '../../../constants';
import type { ITokenProvider, SessionData } from '../../../types/tokenProvider';

process.env['JWT_SECRET'] = 'test-jwt-secret';
process.env['REFRESH_SECRET'] = 'test-refresh-secret';

jest.mock('../../../services', () => ({
  refreshUserTokenService: jest.fn(),
}));

import { refreshUserTokenService } from '../../../services';

const mockRefresh = refreshUserTokenService as unknown as jest.Mock;

const buildAccessToken = (sessionId: string): string =>
  jwt.sign({ sessionId, userId: 'user-1' }, 'test-jwt-secret', { expiresIn: '1h' });

const createMockReq = (refreshToken: string): Partial<Request> => ({
  cookies: { refreshToken },
  headers: {},
  ip: '127.0.0.1',
});

const createMockRes = (): Partial<Response> & {
  jsonBody: unknown;
} => {
  const res: Partial<Response> & { jsonBody: unknown } = { jsonBody: undefined };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockImplementation((body: unknown) => {
    res.jsonBody = body;
    return res;
  });
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
};

const buildSession = (overrides: Partial<SessionData> = {}): SessionData => ({
  sessionId: 'session-1',
  userId: 'user-1',
  organizationId: 'org-1',
  orgSlug: 'org-1-slug',
  orgStatus: 'ACTIVE',
  orgSubscriptionTier: 'TRIAL',
  membershipId: 'mem-1',
  role: 'admin',
  permissionsVersion: 1,
  isRevoked: false,
  refreshTokenHash: 'hash',
  issuedAt: Date.now(),
  rememberMe: false,
  ...overrides,
});

describe('createRefreshTokenController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns accessTokenExpiresAt matching the JWT exp claim', async () => {
    const accessToken = buildAccessToken('session-1');
    mockRefresh.mockResolvedValue({ accessToken, refreshToken: 'new-refresh' });

    const tokenProvider: Partial<ITokenProvider> = {
      getSessionById: jest.fn().mockResolvedValue(buildSession()),
    };

    const handler = createRefreshTokenController({
      tokenProviderInstance: tokenProvider as ITokenProvider,
    });

    const req = createMockReq('old-refresh');
    const res = createMockRes();

    await handler(req as Request, res as unknown as Response, jest.fn());

    const decoded = jwt.decode(accessToken) as { exp: number };
    const expectedIso = new Date(decoded.exp * 1000).toISOString();

    expect(res.jsonBody).toEqual({
      message: 'Token refreshed successfully',
      accessTokenExpiresAt: expectedIso,
    });
  });

  it('sets refresh cookie maxAge to base TTL when session.rememberMe is false', async () => {
    mockRefresh.mockResolvedValue({
      accessToken: buildAccessToken('session-1'),
      refreshToken: 'new-refresh',
    });
    const tokenProvider: Partial<ITokenProvider> = {
      getSessionById: jest.fn().mockResolvedValue(buildSession({ rememberMe: false })),
    };
    const handler = createRefreshTokenController({
      tokenProviderInstance: tokenProvider as ITokenProvider,
    });

    const res = createMockRes();
    await handler(createMockReq('old-refresh') as Request, res as unknown as Response, jest.fn());

    const refreshCookieCall = (res.cookie as jest.Mock).mock.calls.find(
      ([name]) => name === 'refreshToken'
    );
    expect(refreshCookieCall).toBeDefined();
    expect(refreshCookieCall?.[2].maxAge).toBe(REFRESH_TTL_BASE_SECONDS * 1000);
  });

  it('sets refresh cookie maxAge to extended TTL when session.rememberMe is true', async () => {
    mockRefresh.mockResolvedValue({
      accessToken: buildAccessToken('session-1'),
      refreshToken: 'new-refresh',
    });
    const tokenProvider: Partial<ITokenProvider> = {
      getSessionById: jest.fn().mockResolvedValue(buildSession({ rememberMe: true })),
    };
    const handler = createRefreshTokenController({
      tokenProviderInstance: tokenProvider as ITokenProvider,
    });

    const res = createMockRes();
    await handler(createMockReq('old-refresh') as Request, res as unknown as Response, jest.fn());

    const refreshCookieCall = (res.cookie as jest.Mock).mock.calls.find(
      ([name]) => name === 'refreshToken'
    );
    expect(refreshCookieCall?.[2].maxAge).toBe(REFRESH_TTL_EXTENDED_SECONDS * 1000);
  });
});
