import { initializeCpmInvalidationSubscriber } from '../services/cpmInvalidationSubscriber';
import type { EventBus } from '../../shared/messaging/eventBus';
import type { EventMap } from '../../shared/messaging/eventMap';
import type { LoadIntelRedisPort } from '../types/loadIntelPorts';
import type { Logger } from '../../shared/utils/logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SubscribeCall<K extends keyof EventMap> = [
  K,
  string,
  (data: EventMap[K]) => Promise<void>,
];

const buildMockDeps = () => {
  const eventBus: jest.Mocked<EventBus> = {
    publish: jest.fn(),
    subscribe: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
  };

  const redisPort: jest.Mocked<LoadIntelRedisPort> = {
    exists: jest.fn(),
    setWithTtl: jest.fn(),
    zadd: jest.fn(),
    zrevrange: jest.fn(),
    zcard: jest.fn(),
    get: jest.fn(),
    sismember: jest.fn(),
    sadd: jest.fn(),
    zrem: jest.fn(),
    del: jest.fn().mockResolvedValue(undefined),
  };

  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return { eventBus, redisPort, logger };
};

const extractHandler = <K extends keyof EventMap>(
  subscribeMock: jest.Mocked<EventBus>['subscribe'],
  eventName: K,
): ((data: EventMap[K]) => Promise<void>) => {
  const calls = (subscribeMock as unknown as { mock: { calls: SubscribeCall<K>[] } }).mock.calls;
  const call = calls.find(([name]) => name === eventName);

  if (call === undefined) {
    throw new Error(`No subscription found for event: ${eventName}`);
  }

  return call[2];
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('initializeCpmInvalidationSubscriber', () => {
  let deps: ReturnType<typeof buildMockDeps>;

  beforeEach(() => {
    jest.clearAllMocks();
    deps = buildMockDeps();
  });

  const initAndExtract = async () => {
    await initializeCpmInvalidationSubscriber(deps);

    return {
      expenseChanged: extractHandler(deps.eventBus.subscribe, 'vehicle.expense.changed'),
      expenseCreated: extractHandler(deps.eventBus.subscribe, 'vehicle.expense.created'),
    };
  };

  it('subscribes to vehicle.expense.changed and vehicle.expense.created events', async () => {
    // Arrange & Act
    await initializeCpmInvalidationSubscriber(deps);

    // Assert
    expect(deps.eventBus.subscribe).toHaveBeenCalledTimes(2);
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'vehicle.expense.changed',
      'cpm-invalidation',
      expect.any(Function),
    );
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'vehicle.expense.created',
      'cpm-invalidation',
      expect.any(Function),
    );
  });

  describe('vehicle.expense.changed handler', () => {
    it('calls redisPort.del with intel:feed:{organizationId}', async () => {
      // Arrange
      const handlers = await initAndExtract();

      // Act
      await handlers.expenseChanged({
        vehicleId: 'vehicle-1',
        organizationId: 'org-123',
      });

      // Assert
      expect(deps.redisPort.del).toHaveBeenCalledWith('intel:feed:org-123');
      expect(deps.logger.info).toHaveBeenCalledWith(
        'CPM cache invalidated on expense change',
        expect.objectContaining({
          vehicleId: 'vehicle-1',
          organizationId: 'org-123',
        }),
      );
    });
  });

  describe('vehicle.expense.created handler', () => {
    it('calls redisPort.del with intel:feed:{organizationId}', async () => {
      // Arrange
      const handlers = await initAndExtract();

      // Act
      await handlers.expenseCreated({
        vehicleId: 'vehicle-2',
        organizationId: 'org-456',
        expenseId: 'expense-1',
      });

      // Assert
      expect(deps.redisPort.del).toHaveBeenCalledWith('intel:feed:org-456');
      expect(deps.logger.info).toHaveBeenCalledWith(
        'CPM cache invalidated on expense created',
        expect.objectContaining({
          vehicleId: 'vehicle-2',
          organizationId: 'org-456',
          expenseId: 'expense-1',
        }),
      );
    });
  });

  describe('Redis error handling', () => {
    it('logs error and does not throw when redis fails on expense changed', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.redisPort.del.mockRejectedValue(new Error('Redis connection refused'));

      // Act & Assert — should not throw
      await handlers.expenseChanged({
        vehicleId: 'vehicle-1',
        organizationId: 'org-123',
      });

      expect(deps.logger.error).toHaveBeenCalledWith(
        'CPM cache invalidation failed on expense change',
        expect.objectContaining({
          vehicleId: 'vehicle-1',
          organizationId: 'org-123',
          error: 'Redis connection refused',
        }),
      );
    });

    it('logs error and does not throw when redis fails on expense created', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.redisPort.del.mockRejectedValue(new Error('Redis timeout'));

      // Act & Assert — should not throw
      await handlers.expenseCreated({
        vehicleId: 'vehicle-2',
        organizationId: 'org-456',
        expenseId: 'expense-2',
      });

      expect(deps.logger.error).toHaveBeenCalledWith(
        'CPM cache invalidation failed on expense created',
        expect.objectContaining({
          vehicleId: 'vehicle-2',
          organizationId: 'org-456',
          expenseId: 'expense-2',
          error: 'Redis timeout',
        }),
      );
    });
  });
});
