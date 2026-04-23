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
    publishDelayed: jest.fn(),
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
      expenseCreatedNew: extractHandler(deps.eventBus.subscribe, 'expense.created'),
      expenseUpdated: extractHandler(deps.eventBus.subscribe, 'expense.updated'),
      expenseDeleted: extractHandler(deps.eventBus.subscribe, 'expense.deleted'),
      recurringExpenseGenerated: extractHandler(
        deps.eventBus.subscribe,
        'recurring-expense.generated',
      ),
    };
  };

  it('subscribes to all expense-related events', async () => {
    // Arrange & Act
    await initializeCpmInvalidationSubscriber(deps);

    // Assert
    expect(deps.eventBus.subscribe).toHaveBeenCalledTimes(6);
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
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'expense.created',
      'cpm-invalidation',
      expect.any(Function),
    );
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'expense.updated',
      'cpm-invalidation',
      expect.any(Function),
    );
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'expense.deleted',
      'cpm-invalidation',
      expect.any(Function),
    );
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'recurring-expense.generated',
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

  describe('expense.created handler', () => {
    it('calls redisPort.del with intel:feed:{organizationId}', async () => {
      // Arrange
      const handlers = await initAndExtract();

      // Act
      await handlers.expenseCreatedNew({
        expenseId: 'expense-10',
        vehicleId: 'vehicle-3',
        organizationId: 'org-789',
        category: 'FUEL',
      });

      // Assert
      expect(deps.redisPort.del).toHaveBeenCalledWith('intel:feed:org-789');
      expect(deps.logger.info).toHaveBeenCalledWith(
        'CPM cache invalidated on expense.created',
        expect.objectContaining({
          expenseId: 'expense-10',
          vehicleId: 'vehicle-3',
          organizationId: 'org-789',
        }),
      );
    });

    it('logs error and does not throw when redis fails', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.redisPort.del.mockRejectedValue(new Error('Redis down'));

      // Act & Assert — should not throw
      await handlers.expenseCreatedNew({
        expenseId: 'expense-10',
        vehicleId: 'vehicle-3',
        organizationId: 'org-789',
        category: 'FUEL',
      });

      expect(deps.logger.error).toHaveBeenCalledWith(
        'CPM cache invalidation failed on expense.created',
        expect.objectContaining({
          expenseId: 'expense-10',
          vehicleId: 'vehicle-3',
          organizationId: 'org-789',
          error: 'Redis down',
        }),
      );
    });
  });

  describe('expense.updated handler', () => {
    it('calls redisPort.del with intel:feed:{organizationId}', async () => {
      // Arrange
      const handlers = await initAndExtract();

      // Act
      await handlers.expenseUpdated({
        expenseId: 'expense-11',
        vehicleId: 'vehicle-4',
        organizationId: 'org-100',
      });

      // Assert
      expect(deps.redisPort.del).toHaveBeenCalledWith('intel:feed:org-100');
      expect(deps.logger.info).toHaveBeenCalledWith(
        'CPM cache invalidated on expense.updated',
        expect.objectContaining({
          expenseId: 'expense-11',
          vehicleId: 'vehicle-4',
          organizationId: 'org-100',
        }),
      );
    });

    it('logs error and does not throw when redis fails', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.redisPort.del.mockRejectedValue(new Error('Redis timeout'));

      // Act & Assert — should not throw
      await handlers.expenseUpdated({
        expenseId: 'expense-11',
        vehicleId: 'vehicle-4',
        organizationId: 'org-100',
      });

      expect(deps.logger.error).toHaveBeenCalledWith(
        'CPM cache invalidation failed on expense.updated',
        expect.objectContaining({
          error: 'Redis timeout',
        }),
      );
    });
  });

  describe('expense.deleted handler', () => {
    it('calls redisPort.del with intel:feed:{organizationId}', async () => {
      // Arrange
      const handlers = await initAndExtract();

      // Act
      await handlers.expenseDeleted({
        expenseId: 'expense-12',
        vehicleId: 'vehicle-5',
        organizationId: 'org-200',
      });

      // Assert
      expect(deps.redisPort.del).toHaveBeenCalledWith('intel:feed:org-200');
      expect(deps.logger.info).toHaveBeenCalledWith(
        'CPM cache invalidated on expense.deleted',
        expect.objectContaining({
          expenseId: 'expense-12',
          vehicleId: 'vehicle-5',
          organizationId: 'org-200',
        }),
      );
    });

    it('logs error and does not throw when redis fails', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.redisPort.del.mockRejectedValue(new Error('Redis connection refused'));

      // Act & Assert — should not throw
      await handlers.expenseDeleted({
        expenseId: 'expense-12',
        vehicleId: 'vehicle-5',
        organizationId: 'org-200',
      });

      expect(deps.logger.error).toHaveBeenCalledWith(
        'CPM cache invalidation failed on expense.deleted',
        expect.objectContaining({
          error: 'Redis connection refused',
        }),
      );
    });
  });

  describe('recurring-expense.generated handler', () => {
    it('calls redisPort.del with intel:feed:{organizationId}', async () => {
      // Arrange
      const handlers = await initAndExtract();

      // Act
      await handlers.recurringExpenseGenerated({
        vehicleId: 'vehicle-6',
        organizationId: 'org-300',
        count: 3,
      });

      // Assert
      expect(deps.redisPort.del).toHaveBeenCalledWith('intel:feed:org-300');
      expect(deps.logger.info).toHaveBeenCalledWith(
        'CPM cache invalidated on recurring-expense.generated',
        expect.objectContaining({
          vehicleId: 'vehicle-6',
          organizationId: 'org-300',
          count: 3,
        }),
      );
    });

    it('logs error and does not throw when redis fails', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.redisPort.del.mockRejectedValue(new Error('Redis timeout'));

      // Act & Assert — should not throw
      await handlers.recurringExpenseGenerated({
        vehicleId: 'vehicle-6',
        organizationId: 'org-300',
        count: 3,
      });

      expect(deps.logger.error).toHaveBeenCalledWith(
        'CPM cache invalidation failed on recurring-expense.generated',
        expect.objectContaining({
          vehicleId: 'vehicle-6',
          organizationId: 'org-300',
          error: 'Redis timeout',
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
