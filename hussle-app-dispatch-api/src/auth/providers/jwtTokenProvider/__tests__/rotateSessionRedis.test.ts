import type Redis from 'ioredis';
import { createSessionRedis } from '../createSessionRedis';
import { rotateSessionRedis } from '../rotateSessionRedis';
import {
  REFRESH_TTL_BASE_SECONDS,
  REFRESH_TTL_EXTENDED_SECONDS,
  ROTATION_GRACE_TTL_SECONDS,
} from '../../../constants';
import type { CreateSessionInput, SessionData } from '../../../types/tokenProvider';

process.env['JWT_SECRET'] = 'test-jwt-secret';
process.env['REFRESH_SECRET'] = 'test-refresh-secret';

interface SetCall {
  key: string;
  value: string;
  mode?: string;
  ttl?: number;
}

interface DelCall {
  key: string;
}

const buildMockRedis = () => {
  const sets: SetCall[] = [];
  const dels: DelCall[] = [];
  const store = new Map<string, string>();
  const client = {
    set: jest.fn(async (...args: unknown[]) => {
      const [key, value, mode, ttl] = args as [string, string, string?, number?];
      sets.push({ key, value, mode, ttl });
      store.set(key, value);
      return 'OK';
    }),
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    del: jest.fn(async (key: string) => {
      dels.push({ key });
      const had = store.delete(key);
      return had ? 1 : 0;
    }),
  };
  return { client: client as unknown as Redis, sets, dels, store };
};

const buildInput = (overrides: Partial<CreateSessionInput> = {}): CreateSessionInput => ({
  userId: 'user-1',
  organizationId: 'org-1',
  orgSlug: 'org-1-slug',
  orgSubscriptionTier: 'TRIAL',
  orgStatus: 'ACTIVE',
  membershipId: 'mem-1',
  role: 'admin',
  rememberMe: false,
  ...overrides,
});

describe('rotateSessionRedis', () => {
  it('rotates and writes a grace packet on refresh:OLD with grace TTL (rememberMe=false → base TTL on new keys)', async () => {
    const harness = buildMockRedis();

    const { refreshToken: oldRefreshToken } = await createSessionRedis(
      buildInput({ rememberMe: false }),
      { redisClient: harness.client }
    );

    harness.sets.length = 0;
    harness.dels.length = 0;

    const result = await rotateSessionRedis(
      { refreshToken: oldRefreshToken },
      { redisClient: harness.client }
    );

    expect(result).not.toBeNull();
    expect(result?.refreshToken).not.toBe(oldRefreshToken);

    // refresh:OLD is now a grace packet with grace TTL
    const oldKeySet = harness.sets.find((s) => s.key === `refresh:${oldRefreshToken}`);
    expect(oldKeySet).toBeDefined();
    expect(oldKeySet?.ttl).toBe(ROTATION_GRACE_TTL_SECONDS);
    const parsed = JSON.parse(oldKeySet?.value ?? '{}') as {
      kind: string;
      newSessionKey: string;
      newRefreshToken: string;
    };
    expect(parsed.kind).toBe('grace');
    expect(parsed.newRefreshToken).toBe(result?.refreshToken);

    // New session/refresh keys use base TTL
    const newSessionSet = harness.sets.find(
      (s) => s.key.startsWith('session:refresh:') && s.key !== oldKeySet?.key
    );
    expect(newSessionSet?.ttl).toBe(REFRESH_TTL_BASE_SECONDS);
  });

  it('uses extended TTL on new session keys when session.rememberMe is true', async () => {
    const harness = buildMockRedis();

    const { refreshToken: oldRefreshToken } = await createSessionRedis(
      buildInput({ rememberMe: true }),
      { redisClient: harness.client }
    );

    harness.sets.length = 0;

    await rotateSessionRedis(
      { refreshToken: oldRefreshToken },
      { redisClient: harness.client }
    );

    const newSessionSet = harness.sets.find(
      (s) => s.key.startsWith('session:refresh:') && s.key !== `refresh:${oldRefreshToken}`
    );
    expect(newSessionSet?.ttl).toBe(REFRESH_TTL_EXTENDED_SECONDS);

    const parsed = JSON.parse(newSessionSet?.value ?? '{}') as SessionData;
    expect(parsed.rememberMe).toBe(true);
  });

  it('returns null when refresh token key is missing (simulates post-grace expiry)', async () => {
    const harness = buildMockRedis();

    const result = await rotateSessionRedis(
      { refreshToken: 'never-issued-or-expired' },
      { redisClient: harness.client }
    );

    expect(result).toBeNull();
    expect(harness.sets).toHaveLength(0);
    expect(harness.dels).toHaveLength(0);
  });

  it('replays the same new refresh token on grace-window replay without re-rotating', async () => {
    const harness = buildMockRedis();

    const { refreshToken: oldRefreshToken } = await createSessionRedis(
      buildInput({ rememberMe: false }),
      { redisClient: harness.client }
    );

    const firstRotation = await rotateSessionRedis(
      { refreshToken: oldRefreshToken },
      { redisClient: harness.client }
    );

    harness.sets.length = 0;
    harness.dels.length = 0;

    const replay = await rotateSessionRedis(
      { refreshToken: oldRefreshToken },
      { redisClient: harness.client }
    );

    expect(replay).not.toBeNull();
    expect(replay?.refreshToken).toBe(firstRotation?.refreshToken);

    // Replay does NOT delete or rewrite session/refresh keys
    expect(harness.dels).toHaveLength(0);
    expect(harness.sets).toHaveLength(0);
  });
});
