jest.mock('@/shared/emails', () => ({
  renderStatusChangeEmail: jest.fn().mockResolvedValue({
    subject: 'Load LD-001 — Status Update: DISPATCHED',
    html: '<p>Status changed</p>',
  }),
  renderCheckCallEmail: jest.fn().mockResolvedValue({
    subject: 'Load LD-001 — Check Call Update',
    html: '<p>Check call</p>',
  }),
  renderDocumentUploadedEmail: jest.fn().mockResolvedValue({
    subject: 'Load LD-001 — Document uploaded: BOL_SIGNED',
    html: '<p>Document uploaded</p>',
  }),
}));

import { initializeNotificationSubscriber } from '../notificationSubscriber';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { EventMap } from '@/shared/messaging/eventMap';

type Handler = (data: never) => Promise<void>;

const createMockDeps = () => {
  const handlers = new Map<string, Handler>();

  const eventBus: EventBus = {
    publish: jest.fn(),
    publishDelayed: jest.fn(),
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
      frontendUrl: 'http://localhost:5173',
    },
    invokeHandler,
  };
};

describe('notificationSubscriber', () => {
  beforeEach(() => jest.clearAllMocks());

  it('subscribes to load.status.changed, load.checkcall.logged, invitation.created, document.confirmed, and driver.invited', async () => {
    const { deps } = createMockDeps();
    await initializeNotificationSubscriber(deps);

    expect(deps.eventBus.subscribe).toHaveBeenCalledTimes(5);
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
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'invitation.created',
      'notifications-service',
      expect.any(Function),
    );
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'document.confirmed',
      'notifications-service',
      expect.any(Function),
    );
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'driver.invited',
      'notifications-service',
      expect.any(Function),
    );
  });

  it('sends the driver setup link via SMS when the driver has a phone', async () => {
    const { deps, invokeHandler } = createMockDeps();
    await initializeNotificationSubscriber(deps);

    await invokeHandler('driver.invited', {
      driverId: 'drv-1',
      organizationId: 'org-1',
      setupUrl: 'http://localhost:5173/driver-portal/setup/tok-1',
      firstName: 'Sam',
      email: 'sam@example.com',
      phone: '+15551230000',
    });

    expect(deps.smsService.sendSms).toHaveBeenCalledTimes(1);
    expect(deps.smsService.sendSms).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+15551230000',
        body: expect.stringContaining('http://localhost:5173/driver-portal/setup/tok-1'),
      }),
    );
    expect(deps.emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('falls back to email when the driver has no phone', async () => {
    const { deps, invokeHandler } = createMockDeps();
    await initializeNotificationSubscriber(deps);

    await invokeHandler('driver.invited', {
      driverId: 'drv-2',
      organizationId: 'org-1',
      setupUrl: 'http://localhost:5173/driver-portal/setup/tok-2',
      firstName: 'Lee',
      email: 'lee@example.com',
      phone: null,
    });

    expect(deps.emailService.sendEmail).toHaveBeenCalledTimes(1);
    expect(deps.emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'lee@example.com',
        subject: 'Set up your driver portal account',
        html: expect.stringContaining('http://localhost:5173/driver-portal/setup/tok-2'),
      }),
    );
    expect(deps.smsService.sendSms).not.toHaveBeenCalled();
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
      contactCcEmails: [],
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
      contactCcEmails: [],
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
      contactCcEmails: [],
      location: 'Memphis, TN',
      status: 'On time',
      eta: '2026-03-20T14:00:00Z',
      latitude: null,
      longitude: null,
      occurredAt: '2026-03-20T13:00:00Z',
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
      contactCcEmails: [],
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
      contactCcEmails: [],
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
      contactCcEmails: [],
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
      contactCcEmails: [],
    } satisfies EventMap['load.status.changed']);

    expect(deps.logger.error).toHaveBeenCalledWith(
      'Failed to process status change notification',
      expect.objectContaining({ loadId: 'load-1' }),
    );
  });

  describe('document.confirmed handler', () => {
    const documentConfirmedData: EventMap['document.confirmed'] = {
      documentId: 'doc-1',
      entityType: 'load',
      entityId: 'load-1',
      documentType: 'BOL_SIGNED',
      organizationId: 'org-1',
      expiresAt: null,
      loadId: 'load-1',
      customerId: 'cust-1',
      loadNumber: 'LD-001',
      contactEmail: 'customer@test.com',
      contactPhone: '+15551234567',
      contactCcEmails: [],
    };

    it('sends email when customer has DOCUMENT_UPLOADED EMAIL enabled', async () => {
      const { deps, invokeHandler } = createMockDeps();

      deps.settingsRepo.findByCustomerId.mockResolvedValue([
        {
          id: 's-1',
          customerId: 'cust-1',
          trigger: 'DOCUMENT_UPLOADED',
          channel: 'EMAIL',
          enabled: true,
          recipientEmail: 'broker@test.com',
          recipientPhone: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await initializeNotificationSubscriber(deps);
      await invokeHandler('document.confirmed', documentConfirmedData);

      expect(deps.emailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(deps.emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@test.com',
          subject: expect.stringContaining('LD-001'),
        }),
      );
    });

    it('sends SMS when customer has DOCUMENT_UPLOADED SMS enabled', async () => {
      const { deps, invokeHandler } = createMockDeps();

      deps.settingsRepo.findByCustomerId.mockResolvedValue([
        {
          id: 's-1',
          customerId: 'cust-1',
          trigger: 'DOCUMENT_UPLOADED',
          channel: 'SMS',
          enabled: true,
          recipientEmail: null,
          recipientPhone: '+15559999999',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await initializeNotificationSubscriber(deps);
      await invokeHandler('document.confirmed', documentConfirmedData);

      expect(deps.smsService.sendSms).toHaveBeenCalledTimes(1);
      expect(deps.smsService.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+15551234567',
        }),
      );
    });

    it('does not send when DOCUMENT_UPLOADED is disabled', async () => {
      const { deps, invokeHandler } = createMockDeps();

      deps.settingsRepo.findByCustomerId.mockResolvedValue([
        {
          id: 's-1',
          customerId: 'cust-1',
          trigger: 'DOCUMENT_UPLOADED',
          channel: 'EMAIL',
          enabled: false,
          recipientEmail: 'broker@test.com',
          recipientPhone: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await initializeNotificationSubscriber(deps);
      await invokeHandler('document.confirmed', documentConfirmedData);

      expect(deps.emailService.sendEmail).not.toHaveBeenCalled();
      expect(deps.smsService.sendSms).not.toHaveBeenCalled();
    });

    it('skips non-load entity types', async () => {
      const { deps, invokeHandler } = createMockDeps();

      await initializeNotificationSubscriber(deps);
      await invokeHandler('document.confirmed', {
        ...documentConfirmedData,
        entityType: 'carrier',
      });

      expect(deps.settingsRepo.findByCustomerId).not.toHaveBeenCalled();
      expect(deps.emailService.sendEmail).not.toHaveBeenCalled();
      expect(deps.smsService.sendSms).not.toHaveBeenCalled();
    });

    it('skips when customerId is null', async () => {
      const { deps, invokeHandler } = createMockDeps();

      await initializeNotificationSubscriber(deps);
      await invokeHandler('document.confirmed', {
        ...documentConfirmedData,
        customerId: null,
      });

      expect(deps.settingsRepo.findByCustomerId).not.toHaveBeenCalled();
      expect(deps.emailService.sendEmail).not.toHaveBeenCalled();
      expect(deps.smsService.sendSms).not.toHaveBeenCalled();
    });

    it('creates notification log entry on send', async () => {
      const { deps, invokeHandler } = createMockDeps();

      deps.settingsRepo.findByCustomerId.mockResolvedValue([
        {
          id: 's-1',
          customerId: 'cust-1',
          trigger: 'DOCUMENT_UPLOADED',
          channel: 'EMAIL',
          enabled: true,
          recipientEmail: 'broker@test.com',
          recipientPhone: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await initializeNotificationSubscriber(deps);
      await invokeHandler('document.confirmed', documentConfirmedData);

      expect(deps.logRepo.create).toHaveBeenCalledTimes(1);
      expect(deps.logRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: 'DOCUMENT_UPLOADED',
          channel: 'EMAIL',
          loadId: 'load-1',
        }),
      );
    });
  });
});
