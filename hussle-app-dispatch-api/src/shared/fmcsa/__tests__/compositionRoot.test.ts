import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import { createFmcsaModule } from '../compositionRoot';
import type { RedisLike } from '../redisCacheAdapter';

const makeLogger = (): Logger => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

const makeEventBus = (): EventBus => ({
  publish: jest.fn().mockResolvedValue(undefined),
  publishDelayed: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
});

const makeRedis = (): RedisLike => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
});

describe('createFmcsaModule', () => {
  it('wires the mock provider and returns a usable FmcsaService', async () => {
    const module = createFmcsaModule({
      eventBus: makeEventBus(),
      logger: makeLogger(),
      redis: makeRedis(),
      providerKind: 'mock',
    });

    expect(typeof module.service.lookupByMcNumber).toBe('function');
    expect(typeof module.service.lookupByDotNumber).toBe('function');
    expect(typeof module.service.invalidateCache).toBe('function');

    const result = await module.service.lookupByMcNumber('1234567');
    expect(result.status).toBe('found');
  });

  it('wires the safer-web stub without throwing at construction time', () => {
    expect(() =>
      createFmcsaModule({
        eventBus: makeEventBus(),
        logger: makeLogger(),
        redis: makeRedis(),
        providerKind: 'safer-web',
      }),
    ).not.toThrow();
  });

  it('safer-web wiring throws only on first lookup invocation', async () => {
    const module = createFmcsaModule({
      eventBus: makeEventBus(),
      logger: makeLogger(),
      redis: makeRedis(),
      providerKind: 'safer-web',
    });

    await expect(module.service.lookupByMcNumber('1234567')).rejects.toThrow(/not implemented/i);
  });
});
