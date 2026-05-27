import { BadRequestError } from '@mocho/common';

import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';

import type { CachePort } from '../cachePort';
import { createFmcsaService } from '../fmcsaService';
import type { FmcsaPort } from '../fmcsaPort';
import type { FmcsaSnapshot } from '../types';

const makeSnapshot = (overrides: Partial<FmcsaSnapshot> = {}): FmcsaSnapshot => ({
  mcNumber: '1234567',
  dotNumber: '9234567',
  legalName: 'Mock Carrier',
  dba: null,
  address: '1 Mock St',
  authorityStatus: 'ACTIVE',
  safetyRating: 'SATISFACTORY',
  fleetSize: 10,
  officerName: 'John Doe',
  lastCheckedAt: new Date('2026-01-01T00:00:00.000Z'),
  raw: { source: 'test' },
  ...overrides,
});

interface TestDeps {
  provider: jest.Mocked<FmcsaPort>;
  cache: jest.Mocked<CachePort>;
  eventBus: jest.Mocked<EventBus>;
  logger: jest.Mocked<Logger>;
  sleep: jest.Mock<Promise<void>, [number]>;
  uuid: jest.Mock<string, []>;
}

const makeDeps = (): TestDeps => {
  const provider: jest.Mocked<FmcsaPort> = {
    lookupByMcNumber: jest.fn(),
    lookupByDotNumber: jest.fn(),
  };
  const cache: jest.Mocked<CachePort> = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };
  const eventBus: jest.Mocked<EventBus> = {
    publish: jest.fn().mockResolvedValue(undefined),
    publishDelayed: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const sleep = jest.fn<Promise<void>, [number]>().mockResolvedValue(undefined);
  const uuid = jest.fn<string, []>().mockReturnValue('test-uuid');
  return { provider, cache, eventBus, logger, sleep, uuid };
};

const flushMicrotasks = (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('createFmcsaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalization', () => {
    it.each([
      ['MC-1234567'],
      ['mc 1234567'],
      ['  1234567  '],
      ['1234567'],
    ])('reduces %p to digits and uses the same cache key + provider arg', async (input) => {
      const deps = makeDeps();
      const snapshot = makeSnapshot();
      deps.provider.lookupByMcNumber.mockResolvedValue({ status: 'found', snapshot });
      const service = createFmcsaService(deps);

      await service.lookupByMcNumber(input);

      expect(deps.provider.lookupByMcNumber).toHaveBeenCalledWith('1234567');
      expect(deps.cache.get).toHaveBeenCalledWith('fmcsa:mc:1234567');
    });

    it('throws BadRequestError when MC input has no digits and does not publish events', async () => {
      const deps = makeDeps();
      const service = createFmcsaService(deps);

      await expect(() => service.lookupByMcNumber('MC-')).rejects.toThrow(BadRequestError);
      expect(deps.provider.lookupByMcNumber).not.toHaveBeenCalled();
      expect(deps.eventBus.publish).not.toHaveBeenCalled();
    });

    it('throws BadRequestError when DOT input has no digits', async () => {
      const deps = makeDeps();
      const service = createFmcsaService(deps);

      await expect(() => service.lookupByDotNumber('   ')).rejects.toThrow(BadRequestError);
      expect(deps.provider.lookupByDotNumber).not.toHaveBeenCalled();
      expect(deps.eventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('dual-key cache writes', () => {
    it('writes both MC and DOT keys on a successful MC lookup', async () => {
      const deps = makeDeps();
      const snapshot = makeSnapshot({ mcNumber: '1234567', dotNumber: '9234567' });
      deps.provider.lookupByMcNumber.mockResolvedValue({ status: 'found', snapshot });
      const service = createFmcsaService(deps);

      await service.lookupByMcNumber('MC-1234567');

      expect(deps.cache.set).toHaveBeenCalledTimes(2);
      expect(deps.cache.set).toHaveBeenCalledWith('fmcsa:mc:1234567', snapshot, 86400);
      expect(deps.cache.set).toHaveBeenCalledWith('fmcsa:dot:9234567', snapshot, 86400);
    });

    it('writes both MC and DOT keys on a successful DOT lookup', async () => {
      const deps = makeDeps();
      const snapshot = makeSnapshot({ mcNumber: '1234567', dotNumber: '9234567' });
      deps.provider.lookupByDotNumber.mockResolvedValue({ status: 'found', snapshot });
      const service = createFmcsaService(deps);

      await service.lookupByDotNumber('9234567');

      expect(deps.cache.set).toHaveBeenCalledTimes(2);
      expect(deps.cache.set).toHaveBeenCalledWith('fmcsa:mc:1234567', snapshot, 86400);
      expect(deps.cache.set).toHaveBeenCalledWith('fmcsa:dot:9234567', snapshot, 86400);
    });

    it('writes only the MC key when snapshot.dotNumber is null', async () => {
      const deps = makeDeps();
      const snapshot = makeSnapshot({ mcNumber: '1234567', dotNumber: null });
      deps.provider.lookupByMcNumber.mockResolvedValue({ status: 'found', snapshot });
      const service = createFmcsaService(deps);

      await service.lookupByMcNumber('1234567');

      expect(deps.cache.set).toHaveBeenCalledTimes(1);
      expect(deps.cache.set).toHaveBeenCalledWith('fmcsa:mc:1234567', snapshot, 86400);
    });
  });

  describe('cache hit skips provider', () => {
    it('returns cached snapshot for MC lookup without calling provider', async () => {
      const deps = makeDeps();
      const cached = makeSnapshot();
      deps.cache.get.mockResolvedValue(cached);
      const service = createFmcsaService(deps);

      const result = await service.lookupByMcNumber('MC-1234567');

      expect(result).toEqual({ status: 'found', snapshot: cached });
      expect(deps.provider.lookupByMcNumber).not.toHaveBeenCalled();
      expect(deps.cache.set).not.toHaveBeenCalled();
      expect(deps.eventBus.publish).toHaveBeenCalledWith('fmcsa.lookup.completed', {
        correlationId: 'test-uuid',
        identifier: { type: 'mc', value: '1234567' },
        result: { status: 'found', snapshot: cached },
      });
    });

    it('returns cached snapshot for DOT lookup without calling provider', async () => {
      const deps = makeDeps();
      const cached = makeSnapshot({ dotNumber: '9234567' });
      deps.cache.get.mockResolvedValue(cached);
      const service = createFmcsaService(deps);

      const result = await service.lookupByDotNumber('9234567');

      expect(result).toEqual({ status: 'found', snapshot: cached });
      expect(deps.cache.get).toHaveBeenCalledWith('fmcsa:dot:9234567');
      expect(deps.provider.lookupByDotNumber).not.toHaveBeenCalled();
    });
  });

  describe('negative results not cached', () => {
    it('does not cache not_found results and publishes completed event', async () => {
      const deps = makeDeps();
      const identifier = { type: 'mc' as const, value: '1234567' };
      deps.provider.lookupByMcNumber.mockResolvedValue({ status: 'not_found', identifier });
      const service = createFmcsaService(deps);

      const result = await service.lookupByMcNumber('1234567');

      expect(result).toEqual({ status: 'not_found', identifier });
      expect(deps.cache.set).not.toHaveBeenCalled();
      expect(deps.eventBus.publish).toHaveBeenCalledWith('fmcsa.lookup.completed', {
        correlationId: 'test-uuid',
        identifier,
        result: { status: 'not_found' },
      });
    });

    it('does not cache error results after exhausted retries', async () => {
      const deps = makeDeps();
      const identifier = { type: 'mc' as const, value: '1234567' };
      deps.provider.lookupByMcNumber.mockResolvedValue({
        status: 'error',
        reason: 'provider_error',
        identifier,
      });
      const service = createFmcsaService(deps);

      const result = await service.lookupByMcNumber('1234567');

      expect(result).toEqual({ status: 'error', reason: 'provider_error', identifier });
      expect(deps.cache.set).not.toHaveBeenCalled();
      expect(deps.eventBus.publish).toHaveBeenCalledWith('fmcsa.lookup.failed', {
        correlationId: 'test-uuid',
        identifier,
        reason: 'provider_error',
      });
    });
  });

  describe('retry', () => {
    it('retries on provider error and returns the eventual found result', async () => {
      const deps = makeDeps();
      const identifier = { type: 'mc' as const, value: '1234567' };
      const snapshot = makeSnapshot();
      deps.provider.lookupByMcNumber
        .mockResolvedValueOnce({ status: 'error', reason: 'provider_error', identifier })
        .mockResolvedValueOnce({ status: 'error', reason: 'timeout', identifier })
        .mockResolvedValueOnce({ status: 'found', snapshot });
      const service = createFmcsaService(deps);

      const result = await service.lookupByMcNumber('MC-1234567');

      expect(result).toEqual({ status: 'found', snapshot });
      expect(deps.sleep).toHaveBeenCalledTimes(2);
      expect(deps.sleep).toHaveBeenNthCalledWith(1, 1000);
      expect(deps.sleep).toHaveBeenNthCalledWith(2, 5000);
      expect(deps.cache.set).toHaveBeenCalledTimes(2);
      const completedCalls = deps.eventBus.publish.mock.calls.filter(
        (call) => call[0] === 'fmcsa.lookup.completed',
      );
      expect(completedCalls).toHaveLength(1);
    });

    it('exhausts retries (4 total calls) and publishes failed event', async () => {
      const deps = makeDeps();
      const identifier = { type: 'mc' as const, value: '1234567' };
      deps.provider.lookupByMcNumber.mockResolvedValue({
        status: 'error',
        reason: 'provider_error',
        identifier,
      });
      const service = createFmcsaService(deps);

      const result = await service.lookupByMcNumber('1234567');

      expect(result.status).toBe('error');
      expect(deps.provider.lookupByMcNumber).toHaveBeenCalledTimes(4);
      expect(deps.sleep).toHaveBeenCalledTimes(3);
      expect(deps.sleep).toHaveBeenNthCalledWith(1, 1000);
      expect(deps.sleep).toHaveBeenNthCalledWith(2, 5000);
      expect(deps.sleep).toHaveBeenNthCalledWith(3, 30000);
      expect(deps.logger.warn).toHaveBeenCalledTimes(3);
      expect(deps.cache.set).not.toHaveBeenCalled();
      const failedCalls = deps.eventBus.publish.mock.calls.filter(
        (call) => call[0] === 'fmcsa.lookup.failed',
      );
      expect(failedCalls).toHaveLength(1);
    });

    it('does not retry on not_found result', async () => {
      const deps = makeDeps();
      const identifier = { type: 'mc' as const, value: '1234567' };
      deps.provider.lookupByMcNumber.mockResolvedValue({ status: 'not_found', identifier });
      const service = createFmcsaService(deps);

      await service.lookupByMcNumber('1234567');

      expect(deps.provider.lookupByMcNumber).toHaveBeenCalledTimes(1);
      expect(deps.sleep).not.toHaveBeenCalled();
    });
  });

  describe('events', () => {
    it('publishes completed with discriminated found payload', async () => {
      const deps = makeDeps();
      const snapshot = makeSnapshot();
      deps.provider.lookupByMcNumber.mockResolvedValue({ status: 'found', snapshot });
      const service = createFmcsaService(deps);

      await service.lookupByMcNumber('1234567');

      expect(deps.eventBus.publish).toHaveBeenCalledWith('fmcsa.lookup.completed', {
        correlationId: 'test-uuid',
        identifier: { type: 'mc', value: '1234567' },
        result: { status: 'found', snapshot },
      });
    });

    it('publishes completed with not_found discriminated payload (no snapshot key)', async () => {
      const deps = makeDeps();
      const identifier = { type: 'mc' as const, value: '1234567' };
      deps.provider.lookupByMcNumber.mockResolvedValue({ status: 'not_found', identifier });
      const service = createFmcsaService(deps);

      await service.lookupByMcNumber('1234567');

      const completedCall = deps.eventBus.publish.mock.calls.find(
        (call) => call[0] === 'fmcsa.lookup.completed',
      );
      expect(completedCall).toBeDefined();
      const payload = completedCall?.[1] as { result: Record<string, unknown> };
      expect(payload.result).toEqual({ status: 'not_found' });
      expect('snapshot' in payload.result).toBe(false);
    });

    it('publishes failed with reason after exhausted retries', async () => {
      const deps = makeDeps();
      const identifier = { type: 'mc' as const, value: '1234567' };
      deps.provider.lookupByMcNumber.mockResolvedValue({
        status: 'error',
        reason: 'rate_limit',
        identifier,
      });
      const service = createFmcsaService(deps);

      await service.lookupByMcNumber('1234567');

      expect(deps.eventBus.publish).toHaveBeenCalledWith('fmcsa.lookup.failed', {
        correlationId: 'test-uuid',
        identifier,
        reason: 'rate_limit',
      });
    });

    it('uses caller-supplied correlationId verbatim', async () => {
      const deps = makeDeps();
      const snapshot = makeSnapshot();
      deps.provider.lookupByMcNumber.mockResolvedValue({ status: 'found', snapshot });
      const service = createFmcsaService(deps);

      await service.lookupByMcNumber('1234567', { correlationId: 'caller-corr-123' });

      expect(deps.uuid).not.toHaveBeenCalled();
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'fmcsa.lookup.completed',
        expect.objectContaining({ correlationId: 'caller-corr-123' }),
      );
    });

    it('generates a UUID correlationId when none is supplied', async () => {
      const deps = makeDeps();
      const snapshot = makeSnapshot();
      deps.provider.lookupByMcNumber.mockResolvedValue({ status: 'found', snapshot });
      const service = createFmcsaService(deps);

      await service.lookupByMcNumber('1234567');

      expect(deps.uuid).toHaveBeenCalledTimes(1);
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'fmcsa.lookup.completed',
        expect.objectContaining({ correlationId: 'test-uuid' }),
      );
    });

    it('swallows event publish rejection and logs a warning', async () => {
      const deps = makeDeps();
      const snapshot = makeSnapshot();
      deps.provider.lookupByMcNumber.mockResolvedValue({ status: 'found', snapshot });
      deps.eventBus.publish.mockRejectedValue(new Error('rabbit down'));
      const service = createFmcsaService(deps);

      const result = await service.lookupByMcNumber('1234567');
      await flushMicrotasks();

      expect(result.status).toBe('found');
      expect(deps.logger.warn).toHaveBeenCalledWith(
        'FMCSA event publish failed (completed)',
        expect.objectContaining({ error: 'rabbit down' }),
      );
    });
  });

  describe('skipCache', () => {
    it('bypasses cache.get but still writes on found result', async () => {
      const deps = makeDeps();
      const snapshot = makeSnapshot();
      deps.cache.get.mockResolvedValue(makeSnapshot({ legalName: 'Stale' }));
      deps.provider.lookupByMcNumber.mockResolvedValue({ status: 'found', snapshot });
      const service = createFmcsaService(deps);

      const result = await service.lookupByMcNumber('1234567', { skipCache: true });

      expect(deps.cache.get).not.toHaveBeenCalled();
      expect(deps.provider.lookupByMcNumber).toHaveBeenCalledTimes(1);
      expect(deps.cache.set).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ status: 'found', snapshot });
    });
  });

  describe('invalidateCache', () => {
    it('calls cache.del with the MC key', async () => {
      const deps = makeDeps();
      const service = createFmcsaService(deps);

      await service.invalidateCache({ type: 'mc', value: '1234567' });

      expect(deps.cache.del).toHaveBeenCalledWith('fmcsa:mc:1234567');
    });

    it('calls cache.del with the DOT key', async () => {
      const deps = makeDeps();
      const service = createFmcsaService(deps);

      await service.invalidateCache({ type: 'dot', value: '9234567' });

      expect(deps.cache.del).toHaveBeenCalledWith('fmcsa:dot:9234567');
    });
  });
});
