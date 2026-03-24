import { initializeNotificationSubscriber } from '../notificationSubscriber';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { EventMap } from '@/shared/messaging/eventMap';

type Handler = (data: never) => Promise<void>;

const createMockDeps = () => {
  const handlers = new Map<string, Handler>();

  const eventBus: EventBus = {
    publish: jest.fn(),
    subscribe: jest.fn(async (event: string, _group: string, handler: Handler) => {
      handlers.set(event, handler);
    }),
    close: jest.fn(),
  };

  const settingsRepo = {
    findByCustomerId: jest.fn().mockResolvedValue([]),
    upsert: jest.fn(),
    deleteByCustomerIdAndTriggerChannel: jest.fn(),
  };

  const overrideRepo = {
    findByLoadId: jest.fn().mockResolvedValue([]),
    upsert: jest.fn(),
    deleteByLoadIdAndTriggerChannel: jest.fn(),
  };

  const logRepo = {
    create: jest.fn().mockResolvedValue({ id: 'log-1' }),
    findByLoadId: jest.fn().mockResolvedValue([]),
  };

  const tokenRepo = {
    create: jest.fn(),
    findByToken: jest.fn(),
    findActiveByLoadId: jest.fn().mockResolvedValue(null),
    revoke: jest.fn(),
  };

  const emailService = {
    sendEmail: jest.fn().mockResolvedValue(undefined),
  };

  const smsService = {
    sendSms: jest.fn().mockResolvedValue(undefined),
  };

  const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const invokeHandler = async (event: string, data: unknown): Promise<void> => {
    const handler = handlers.get(event);
    expect(handler).toBeDefined();
    await (handler as Handler)(data as never);
  };

  return {
    deps: {
      eventBus,
      settingsRepo,
      overrideRepo,
      logRepo,
      tokenRepo,
      emailService,
      smsService,
      logger,
      trackingBaseUrl: 'http://localhost:5173',
    },
    invokeHandler,
  };
};

describe('notificationSubscriber', () => {
  beforeEach(() => jest.clearAllMocks());

  it('subscribes to load.status.changed and load.checkcall.logged', async () => {
    const { deps } = createMockDeps();
    await initializeNotificationSubscriber(deps);

    expect(deps.eventBus.subscribe).toHaveBeenCalledTimes(2);
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'load.status.changed',
      'notifications-service',
      expect.any(Function),
    );
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'load.checkcall.logged',
      'notifications-service',
      expect.any(Function),
    );
  });

  it('skips notification when customerId is null', async () => {
    const { deps, invokeHandler } = createMockDeps();
    await initializeNotificationSubscriber(deps);

    await invokeHandler('load.status.changed', {
      loadId: 'load-1',
      organizationId: 'org-1',
      loadNumber: 'LD-001',
      fromStatus: 'BOOKED',
      toStatus: 'DISPATCHED',
      customerId: null,
      contactEmail: null,
      contactPhone: null,
    } satisfies EventMap['load.status.changed']);

    expect(deps.settingsRepo.findByCustomerId).not.toHaveBeenCalled();
    expect(deps.emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('sends email when customer has EMAIL settings for STATUS_CHANGE', async () => {
    const { deps, invokeHandler } = createMockDeps();

    deps.settingsRepo.findByCustomerId.mockResolvedValue([
      {
        id: 's-1',
        customerId: 'cust-1',
        trigger: 'STATUS_CHANGE',
        channel: 'EMAIL',
        enabled: true,
        recipientEmail: 'broker@test.com',
        recipientPhone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await initializeNotificationSubscriber(deps);

    await invokeHandler('load.status.changed', {
      loadId: 'load-1',
      organizationId: 'org-1',
      loadNumber: 'LD-001',
      fromStatus: 'BOOKED',
      toStatus: 'DISPATCHED',
      customerId: 'cust-1',
      contactEmail: null,
      contactPhone: null,
    } satisfies EventMap['load.status.changed']);

    expect(deps.emailService.sendEmail).toHaveBeenCalledTimes(1);
    expect(deps.emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'broker@test.com',
        subject: expect.stringContaining('LD-001'),
      }),
    );
    expect(deps.logRepo.create).toHaveBeenCalledTimes(1);
  });

  it('sends SMS when customer has SMS settings for CHECK_CALL', async () => {
    const { deps, invokeHandler } = createMockDeps();

    deps.settingsRepo.findByCustomerId.mockResolvedValue([
      {
        id: 's-1',
        customerId: 'cust-1',
        trigger: 'CHECK_CALL',
        channel: 'SMS',
        enabled: true,
        recipientEmail: null,
        recipientPhone: '+15551234567',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await initializeNotificationSubscriber(deps);

    await invokeHandler('load.checkcall.logged', {
      loadId: 'load-1',
      organizationId: 'org-1',
      loadNumber: 'LD-001',
      checkCallId: 'cc-1',
      customerId: 'cust-1',
      contactEmail: null,
      contactPhone: null,
      location: 'Memphis, TN',
      status: 'On time',
      eta: '2026-03-20T14:00:00Z',
    } satisfies EventMap['load.checkcall.logged']);

    expect(deps.smsService.sendSms).toHaveBeenCalledTimes(1);
    expect(deps.smsService.sendSms).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+15551234567',
      }),
    );
  });

  it('uses load contact email over settings-configured recipient', async () => {
    const { deps, invokeHandler } = createMockDeps();

    deps.settingsRepo.findByCustomerId.mockResolvedValue([
      {
        id: 's-1',
        customerId: 'cust-1',
        trigger: 'STATUS_CHANGE',
        channel: 'EMAIL',
        enabled: true,
        recipientEmail: 'settings-default@broker.com',
        recipientPhone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await initializeNotificationSubscriber(deps);

    await invokeHandler('load.status.changed', {
      loadId: 'load-1',
      organizationId: 'org-1',
      loadNumber: 'LD-001',
      fromStatus: 'BOOKED',
      toStatus: 'DISPATCHED',
      customerId: 'cust-1',
      contactEmail: 'load-contact@broker.com',
      contactPhone: null,
    } satisfies EventMap['load.status.changed']);

    expect(deps.emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'load-contact@broker.com',
      }),
    );
  });

  it('falls back to settings recipient when load has no contact', async () => {
    const { deps, invokeHandler } = createMockDeps();

    deps.settingsRepo.findByCustomerId.mockResolvedValue([
      {
        id: 's-1',
        customerId: 'cust-1',
        trigger: 'STATUS_CHANGE',
        channel: 'EMAIL',
        enabled: true,
        recipientEmail: 'settings-default@broker.com',
        recipientPhone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await initializeNotificationSubscriber(deps);

    await invokeHandler('load.status.changed', {
      loadId: 'load-1',
      organizationId: 'org-1',
      loadNumber: 'LD-001',
      fromStatus: 'BOOKED',
      toStatus: 'DISPATCHED',
      customerId: 'cust-1',
      contactEmail: null,
      contactPhone: null,
    } satisfies EventMap['load.status.changed']);

    expect(deps.emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'settings-default@broker.com',
      }),
    );
  });

  it('skips notification when no matching settings exist', async () => {
    const { deps, invokeHandler } = createMockDeps();

    deps.settingsRepo.findByCustomerId.mockResolvedValue([]);

    await initializeNotificationSubscriber(deps);

    await invokeHandler('load.status.changed', {
      loadId: 'load-1',
      organizationId: 'org-1',
      loadNumber: 'LD-001',
      fromStatus: 'BOOKED',
      toStatus: 'DISPATCHED',
      customerId: 'cust-1',
      contactEmail: null,
      contactPhone: null,
    } satisfies EventMap['load.status.changed']);

    expect(deps.emailService.sendEmail).not.toHaveBeenCalled();
    expect(deps.smsService.sendSms).not.toHaveBeenCalled();
  });

  it('logs error when notification processing fails', async () => {
    const { deps, invokeHandler } = createMockDeps();

    deps.settingsRepo.findByCustomerId.mockRejectedValue(new Error('DB down'));

    await initializeNotificationSubscriber(deps);

    await invokeHandler('load.status.changed', {
      loadId: 'load-1',
      organizationId: 'org-1',
      loadNumber: 'LD-001',
      fromStatus: 'BOOKED',
      toStatus: 'DISPATCHED',
      customerId: 'cust-1',
      contactEmail: null,
      contactPhone: null,
    } satisfies EventMap['load.status.changed']);

    expect(deps.logger.error).toHaveBeenCalledWith(
      'Failed to process status change notification',
      expect.objectContaining({ loadId: 'load-1' }),
    );
  });
});
