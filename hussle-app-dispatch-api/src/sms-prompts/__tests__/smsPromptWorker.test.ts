import type { EventBus } from '@/shared/messaging/eventBus';
import type { EventMap } from '@/shared/messaging/eventMap';
import type { OrgSettings, SmsPromptSchedule } from '@prisma/client';
import { initializeSmsPromptWorker } from '../services/smsPromptWorker';
import type { SmsPromptScheduleRepoPort } from '../types/smsPromptScheduleRepoPort';
import type {
  LoadForScheduling,
  LoadSchedulerQueryPort,
} from '../types/loadSchedulerQueryPort';
import type { DriverQueryPort } from '../types/driverQueryPort';
import type { SettingsRepoPort } from '@/settings/types/settingsTypes';
import type { SmsService } from '@/shared/notifications/smsService';
import type { TrackingTokenService } from '@/notifications/services/trackingTokenService';

type Handler = (data: never) => Promise<void>;

const makeScheduleRow = (
  overrides: Partial<SmsPromptSchedule> = {},
): SmsPromptSchedule => ({
  id: overrides.id ?? 'row-1',
  loadId: overrides.loadId ?? 'load-1',
  driverId: overrides.driverId ?? 'driver-1',
  organizationId: overrides.organizationId ?? 'org-1',
  anchor: overrides.anchor ?? 'DISPATCHED',
  scheduledAt: overrides.scheduledAt ?? new Date(),
  status: overrides.status ?? 'PENDING',
  sentAt: overrides.sentAt ?? null,
  twilioMessageSid: overrides.twilioMessageSid ?? null,
  failureReason: overrides.failureReason ?? null,
  createdAt: overrides.createdAt ?? new Date(),
  updatedAt: overrides.updatedAt ?? new Date(),
});

const baseLoad = (
  overrides: Partial<LoadForScheduling> = {},
): LoadForScheduling => ({
  id: 'load-1',
  loadNumber: 'LD-001',
  organizationId: 'org-1',
  driverId: 'driver-1',
  status: 'DISPATCHED',
  stops: [],
  ...overrides,
});

const settingsRow = (
  overrides: Partial<OrgSettings> = {},
): OrgSettings =>
  ({
    id: 'settings-1',
    organizationId: 'org-1',
    smsPrePickupLeadMinutes: 60,
    smsTransitIntervalMinutes: 180,
    smsPostPickupEscalationMinutes: 30,
    smsCooldownMinutes: 15,
    ...overrides,
  }) as unknown as OrgSettings;

const promptDuePayload = (
  overrides: Partial<EventMap['sms.prompt.due']> = {},
): EventMap['sms.prompt.due'] => ({
  smsPromptScheduleId: 'row-1',
  loadId: 'load-1',
  organizationId: 'org-1',
  anchor: 'DISPATCHED',
  ...overrides,
});

const buildMocks = () => {
  const handlers = new Map<string, Handler>();

  const eventBus: EventBus = {
    publish: jest.fn().mockResolvedValue(undefined),
    publishDelayed: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn(
      async (event: string, _group: string, handler: Handler) => {
        handlers.set(event, handler);
      },
    ),
    close: jest.fn(),
  };

  const scheduleRepo: jest.Mocked<SmsPromptScheduleRepoPort> = {
    create: jest.fn(async (input) =>
      makeScheduleRow({
        id: 'row-next',
        loadId: input.loadId,
        driverId: input.driverId,
        organizationId: input.organizationId,
        anchor: input.anchor,
        scheduledAt: input.scheduledAt,
      }),
    ),
    findById: jest.fn(),
    findPending: jest.fn().mockResolvedValue([]),
    cancel: jest.fn().mockResolvedValue(undefined),
    markSent: jest.fn(
      async (id: string, _sid: string | null, _sentAt: Date) =>
        makeScheduleRow({ id, status: 'SENT' }),
    ),
    markFailed: jest.fn(async (id: string, reason: string) =>
      makeScheduleRow({ id, status: 'FAILED', failureReason: reason }),
    ),
    findByLoad: jest.fn(),
    lastSentAtForLoad: jest.fn().mockResolvedValue(null),
  };

  const loadRepo: jest.Mocked<LoadSchedulerQueryPort> = {
    findForScheduling: jest.fn().mockResolvedValue(baseLoad()),
  };

  const driverRepo: jest.Mocked<DriverQueryPort> = {
    findById: jest.fn().mockResolvedValue({
      id: 'driver-1',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+15551234567',
    }),
  };

  const settingsRepo: jest.Mocked<SettingsRepoPort> = {
    findByOrganizationId: jest.fn().mockResolvedValue(settingsRow()),
    upsert: jest.fn(),
  };

  const smsService: jest.Mocked<SmsService> = {
    sendSms: jest.fn().mockResolvedValue({ messageSid: 'SM_TEST_SID' }),
  };

  const trackingTokenService: jest.Mocked<TrackingTokenService> = {
    getOrCreate: jest.fn(),
    getOrCreateDriverToken: jest.fn().mockResolvedValue({
      id: 'tok-1',
      token: 'driver-token-abc',
      loadId: 'load-1',
      expiresAt: new Date('2099-01-01T00:00:00Z'),
      revokedAt: null,
      type: 'DRIVER',
      createdAt: new Date(),
    }),
    getTrackingSummary: jest.fn(),
    revoke: jest.fn(),
  };

  const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const invokeHandler = async (
    event: keyof EventMap,
    data: unknown,
  ): Promise<void> => {
    const handler = handlers.get(event);
    expect(handler).toBeDefined();
    await (handler as Handler)(data as never);
  };

  return {
    deps: {
      eventBus,
      scheduleRepo,
      loadRepo,
      driverRepo,
      settingsRepo,
      smsService,
      trackingTokenService,
      logger,
      trackingBaseUrl: 'https://app.example.com',
    },
    invokeHandler,
  };
};

describe('initializeSmsPromptWorker', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-01T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('subscribes to sms.prompt.due with queueGroup "sms-prompts-service"', async () => {
    // Arrange
    const { deps } = buildMocks();

    // Act
    await initializeSmsPromptWorker(deps);

    // Assert
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'sms.prompt.due',
      'sms-prompts-service',
      expect.any(Function),
    );
  });

  it('sends SMS and marks SENT on happy path', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    deps.scheduleRepo.findById.mockResolvedValue(makeScheduleRow());
    await initializeSmsPromptWorker(deps);

    // Act
    await invokeHandler('sms.prompt.due', promptDuePayload());

    // Assert
    expect(deps.smsService.sendSms).toHaveBeenCalledTimes(1);
    const smsCall = deps.smsService.sendSms.mock.calls[0]?.[0];
    expect(smsCall?.to).toBe('+15551234567');
    expect(smsCall?.body).toContain('LD-001');
    expect(smsCall?.body).toContain(
      'https://app.example.com/driver-portal/driver-token-abc',
    );
    expect(deps.scheduleRepo.markSent).toHaveBeenCalledWith(
      'row-1',
      'SM_TEST_SID',
      expect.any(Date),
    );
  });

  it('skips sending when the row is no longer PENDING', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    deps.scheduleRepo.findById.mockResolvedValue(
      makeScheduleRow({ status: 'SENT' }),
    );
    await initializeSmsPromptWorker(deps);

    // Act
    await invokeHandler('sms.prompt.due', promptDuePayload());

    // Assert
    expect(deps.smsService.sendSms).not.toHaveBeenCalled();
    expect(deps.scheduleRepo.markSent).not.toHaveBeenCalled();
    expect(deps.scheduleRepo.markFailed).not.toHaveBeenCalled();
  });

  it('marks FAILED with "cooldown not elapsed" when another prompt was sent recently', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    deps.scheduleRepo.findById.mockResolvedValue(makeScheduleRow());
    deps.scheduleRepo.lastSentAtForLoad.mockResolvedValue(
      new Date(Date.now() - 10 * 60 * 1000), // 10 min ago, cooldown is 15 min
    );
    await initializeSmsPromptWorker(deps);

    // Act
    await invokeHandler('sms.prompt.due', promptDuePayload());

    // Assert
    expect(deps.smsService.sendSms).not.toHaveBeenCalled();
    expect(deps.scheduleRepo.markFailed).toHaveBeenCalledWith(
      'row-1',
      'cooldown not elapsed',
    );
  });

  it('marks FAILED with "driver has no phone" when driver phone is null', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    deps.scheduleRepo.findById.mockResolvedValue(makeScheduleRow());
    deps.driverRepo.findById.mockResolvedValue({
      id: 'driver-1',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: null,
    });
    await initializeSmsPromptWorker(deps);

    // Act
    await invokeHandler('sms.prompt.due', promptDuePayload());

    // Assert
    expect(deps.smsService.sendSms).not.toHaveBeenCalled();
    expect(deps.scheduleRepo.markFailed).toHaveBeenCalledWith(
      'row-1',
      'driver has no phone',
    );
  });

  it('marks FAILED with "load not found" when the load is missing', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    deps.scheduleRepo.findById.mockResolvedValue(makeScheduleRow());
    deps.loadRepo.findForScheduling.mockResolvedValue(null);
    await initializeSmsPromptWorker(deps);

    // Act
    await invokeHandler('sms.prompt.due', promptDuePayload());

    // Assert
    expect(deps.scheduleRepo.markFailed).toHaveBeenCalledWith(
      'row-1',
      'load not found',
    );
  });

  it('marks FAILED with "load already terminal" when the load is DELIVERED', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    deps.scheduleRepo.findById.mockResolvedValue(makeScheduleRow());
    deps.loadRepo.findForScheduling.mockResolvedValue(
      baseLoad({ status: 'DELIVERED' }),
    );
    await initializeSmsPromptWorker(deps);

    // Act
    await invokeHandler('sms.prompt.due', promptDuePayload());

    // Assert
    expect(deps.scheduleRepo.markFailed).toHaveBeenCalledWith(
      'row-1',
      'load already terminal',
    );
  });

  it('marks FAILED with the error message when Twilio throws', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    deps.scheduleRepo.findById.mockResolvedValue(makeScheduleRow());
    deps.smsService.sendSms.mockRejectedValueOnce(new Error('Twilio 500'));
    await initializeSmsPromptWorker(deps);

    // Act
    await invokeHandler('sms.prompt.due', promptDuePayload());

    // Assert
    expect(deps.scheduleRepo.markFailed).toHaveBeenCalledWith(
      'row-1',
      'Twilio 500',
    );
    expect(deps.scheduleRepo.markSent).not.toHaveBeenCalled();
  });

  it('re-enqueues the next TRANSIT_INTERVAL after a successful send while IN_TRANSIT', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    deps.scheduleRepo.findById.mockResolvedValue(
      makeScheduleRow({ anchor: 'TRANSIT_INTERVAL' }),
    );
    deps.loadRepo.findForScheduling.mockResolvedValue(
      baseLoad({ status: 'IN_TRANSIT' }),
    );
    await initializeSmsPromptWorker(deps);

    // Act
    await invokeHandler(
      'sms.prompt.due',
      promptDuePayload({ anchor: 'TRANSIT_INTERVAL' }),
    );

    // Assert
    expect(deps.scheduleRepo.markSent).toHaveBeenCalled();
    expect(deps.scheduleRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        anchor: 'TRANSIT_INTERVAL',
        loadId: 'load-1',
      }),
    );
    expect(deps.eventBus.publishDelayed).toHaveBeenCalledWith(
      'sms.prompt.due',
      expect.objectContaining({
        anchor: 'TRANSIT_INTERVAL',
        loadId: 'load-1',
      }),
      180 * 60 * 1000,
    );
  });

  it('does not re-enqueue a TRANSIT_INTERVAL when the load has reached AT_DELIVERY', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    deps.scheduleRepo.findById.mockResolvedValue(
      makeScheduleRow({ anchor: 'TRANSIT_INTERVAL' }),
    );
    deps.loadRepo.findForScheduling.mockResolvedValue(
      baseLoad({ status: 'AT_DELIVERY' }),
    );
    await initializeSmsPromptWorker(deps);

    // Act
    await invokeHandler(
      'sms.prompt.due',
      promptDuePayload({ anchor: 'TRANSIT_INTERVAL' }),
    );

    // Assert
    expect(deps.scheduleRepo.markSent).toHaveBeenCalled();
    expect(deps.scheduleRepo.create).not.toHaveBeenCalled();
    expect(deps.eventBus.publishDelayed).not.toHaveBeenCalled();
  });
});
