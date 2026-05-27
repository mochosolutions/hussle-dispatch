import type { Logger } from '@/shared/utils/logger';
import type { CachePort } from '../cachePort';
import { createRedisCacheAdapter, type RedisLike } from '../redisCacheAdapter';
import type { FmcsaSnapshot } from '../types';

interface FakeRedis extends RedisLike {
  get: jest.Mock<Promise<string | null>, [string]>;
  set: jest.Mock<Promise<unknown>, [string, string, 'EX', number]>;
  del: jest.Mock<Promise<unknown>, [string]>;
  __store: Map<string, string>;
}

const makeFakeRedis = (): FakeRedis => {
  const store = new Map<string, string>();
  const get = jest.fn(
    (key: string): Promise<string | null> => Promise.resolve(store.get(key) ?? null),
  );
  const setImpl = (...args: [string, string, 'EX', number]): Promise<unknown> => {
    const [key, value] = args;
    store.set(key, value);
    return Promise.resolve('OK');
  };
  const set = jest.fn(setImpl);
  const del = jest.fn((key: string): Promise<unknown> => {
    const had = store.delete(key);
    return Promise.resolve(had ? 1 : 0);
  });
  return { get, set, del, __store: store };
};

const makeLogger = (): jest.Mocked<Logger> => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const makeSnapshot = (): FmcsaSnapshot => ({
  mcNumber: 'MC123456',
  dotNumber: 'DOT987654',
  legalName: 'Acme Trucking LLC',
  dba: 'Acme Trucks',
  address: '123 Main St, Springfield, IL 62701',
  authorityStatus: 'ACTIVE',
  safetyRating: 'SATISFACTORY',
  fleetSize: 25,
  officerName: 'John Doe',
  lastCheckedAt: new Date('2026-01-15T12:00:00.000Z'),
  raw: { fmcsaProviderField: 'value' },
});

interface Harness {
  adapter: CachePort;
  redis: FakeRedis;
  logger: jest.Mocked<Logger>;
}

const makeHarness = (): Harness => {
  const redis = makeFakeRedis();
  const logger = makeLogger();
  const adapter = createRedisCacheAdapter({ redis, logger });
  return { adapter, redis, logger };
};

describe('createRedisCacheAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('round-trip behavior', () => {
    it('returns a deep-equal snapshot with Date revived after set and get', async () => {
      const { adapter } = makeHarness();
      const snapshot = makeSnapshot();
      const key = 'fmcsa:mc:MC123456';

      await adapter.set(key, snapshot, 86400);
      const result = await adapter.get(key);

      expect(result).not.toBeNull();
      expect(result?.mcNumber).toBe(snapshot.mcNumber);
      expect(result?.dotNumber).toBe(snapshot.dotNumber);
      expect(result?.legalName).toBe(snapshot.legalName);
      expect(result?.dba).toBe(snapshot.dba);
      expect(result?.address).toBe(snapshot.address);
      expect(result?.authorityStatus).toBe(snapshot.authorityStatus);
      expect(result?.safetyRating).toBe(snapshot.safetyRating);
      expect(result?.fleetSize).toBe(snapshot.fleetSize);
      expect(result?.officerName).toBe(snapshot.officerName);
      expect(result?.raw).toEqual(snapshot.raw);
      expect(result?.lastCheckedAt).toBeInstanceOf(Date);
      expect(result?.lastCheckedAt.toISOString()).toBe(snapshot.lastCheckedAt.toISOString());
    });

    it('passes the TTL through to redis.set with EX mode', async () => {
      const { adapter, redis } = makeHarness();
      const snapshot = makeSnapshot();

      await adapter.set('fmcsa:mc:MC123456', snapshot, 3600);

      expect(redis.set).toHaveBeenCalledWith(
        'fmcsa:mc:MC123456',
        expect.any(String),
        'EX',
        3600,
      );
    });
  });

  describe('get on missing key', () => {
    it('returns null when no entry exists', async () => {
      const { adapter } = makeHarness();

      const result = await adapter.get('fmcsa:mc:UNKNOWN');

      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('clears the entry so subsequent get returns null', async () => {
      const { adapter } = makeHarness();
      const snapshot = makeSnapshot();
      const key = 'fmcsa:mc:MC123456';

      await adapter.set(key, snapshot, 86400);
      await adapter.del(key);
      const result = await adapter.get(key);

      expect(result).toBeNull();
    });
  });

  describe('transport error handling', () => {
    it('returns null and logs warn when redis.get rejects', async () => {
      const { adapter, redis, logger } = makeHarness();
      redis.get.mockRejectedValueOnce(new Error('connection refused'));

      const result = await adapter.get('fmcsa:mc:MC123456');

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'FMCSA cache get failed',
        expect.objectContaining({ key: 'fmcsa:mc:MC123456', error: 'connection refused' }),
      );
    });

    it('swallows error and logs warn when redis.set rejects', async () => {
      const { adapter, redis, logger } = makeHarness();
      redis.set.mockRejectedValueOnce(new Error('write timeout'));

      await expect(
        adapter.set('fmcsa:mc:MC123456', makeSnapshot(), 86400),
      ).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        'FMCSA cache set failed',
        expect.objectContaining({ key: 'fmcsa:mc:MC123456', error: 'write timeout' }),
      );
    });

    it('swallows error and logs warn when redis.del rejects', async () => {
      const { adapter, redis, logger } = makeHarness();
      redis.del.mockRejectedValueOnce(new Error('delete failed'));

      await expect(adapter.del('fmcsa:mc:MC123456')).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        'FMCSA cache del failed',
        expect.objectContaining({ key: 'fmcsa:mc:MC123456', error: 'delete failed' }),
      );
    });
  });

  describe('malformed cached payload', () => {
    it('returns null when the stored value is not valid JSON', async () => {
      const { adapter, redis } = makeHarness();
      redis.__store.set('fmcsa:mc:MC123456', 'not-json{');

      const result = await adapter.get('fmcsa:mc:MC123456');

      expect(result).toBeNull();
    });

    it('returns null when the stored value is missing required fields', async () => {
      const { adapter, redis } = makeHarness();
      redis.__store.set(
        'fmcsa:mc:MC123456',
        JSON.stringify({ mcNumber: 'MC1', legalName: 'X' }),
      );

      const result = await adapter.get('fmcsa:mc:MC123456');

      expect(result).toBeNull();
    });

    it.each([
      ['top-level non-object', '"just-a-string"'],
      ['mcNumber wrong type', { override: { mcNumber: 123 } }],
      ['dotNumber wrong type', { override: { dotNumber: 5 } }],
      ['legalName wrong type', { override: { legalName: false } }],
      ['dba wrong type', { override: { dba: 42 } }],
      ['address wrong type', { override: { address: true } }],
      ['authorityStatus invalid', { override: { authorityStatus: 'BOGUS' } }],
      ['safetyRating invalid', { override: { safetyRating: 'POOR' } }],
      ['fleetSize wrong type', { override: { fleetSize: 'lots' } }],
      ['officerName wrong type', { override: { officerName: 7 } }],
      ['lastCheckedAt wrong type', { override: { lastCheckedAt: true } }],
      ['raw wrong type', { override: { raw: 'oops' } }],
    ])('returns null when %s', async (_label, payload) => {
      const { adapter, redis } = makeHarness();
      const stored =
        typeof payload === 'string'
          ? payload
          : JSON.stringify({ ...makeSnapshot(), ...payload.override });
      redis.__store.set('fmcsa:mc:MC123456', stored);

      const result = await adapter.get('fmcsa:mc:MC123456');

      expect(result).toBeNull();
    });
  });
});
