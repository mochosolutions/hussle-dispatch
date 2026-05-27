import type Redis from 'ioredis';
import { createSessionRedis } from '../createSessionRedis';
import {
  REFRESH_TTL_BASE_SECONDS,
  REFRESH_TTL_EXTENDED_SECONDS,
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

const buildMockRedis = () => {
  const sets: SetCall[] = [];
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
      const had = store.delete(key);
      return had ? 1 : 0;
    }),
  };
  return { client: client as unknown as Redis, sets, store };
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

describe('createSessionRedis', () => {
  it('uses base TTL on all four EX calls when rememberMe is false', async () => {
    const { client, sets } = buildMockRedis();

    await createSessionRedis(buildInput({ rememberMe: false }), { redisClient: client });

    expect(sets).toHaveLength(4);
    sets.forEach((call) => {
      expect(call.mode).toBe('EX');
      expect(call.ttl).toBe(REFRESH_TTL_BASE_SECONDS);
    });
  });

  it('uses extended TTL on all four EX calls when rememberMe is true', async () => {
    const { client, sets } = buildMockRedis();

    await createSessionRedis(buildInput({ rememberMe: true }), { redisClient: client });

    expect(sets).toHaveLength(4);
    sets.forEach((call) => {
      expect(call.mode).toBe('EX');
      expect(call.ttl).toBe(REFRESH_TTL_EXTENDED_SECONDS);
    });
  });

  it('persists rememberMe in the SessionData JSON blob', async () => {
    const { client, sets } = buildMockRedis();

    await createSessionRedis(buildInput({ rememberMe: true }), { redisClient: client });

    const sessionBlobCall = sets.find((c) => c.key.startsWith('session:refresh:'));
    expect(sessionBlobCall).toBeDefined();
    const parsed = JSON.parse(sessionBlobCall?.value ?? '{}') as SessionData;
    expect(parsed.rememberMe).toBe(true);
  });

  it('persists rememberMe=false when not provided', async () => {
    const { client, sets } = buildMockRedis();

    await createSessionRedis(buildInput({ rememberMe: undefined }), { redisClient: client });

    const sessionBlobCall = sets.find((c) => c.key.startsWith('session:refresh:'));
    const parsed = JSON.parse(sessionBlobCall?.value ?? '{}') as SessionData;
    expect(parsed.rememberMe).toBe(false);
  });
});
