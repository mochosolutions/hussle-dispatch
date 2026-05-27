import type { EventBus } from '@/shared/messaging/eventBus';
import type { EventMap } from '@/shared/messaging/eventMap';
import type { OrgSettings, SmsPromptSchedule } from '@prisma/client';
import { initializeSmsPromptSchedulerSubscriber } from '../services/smsPromptSchedulerSubscriber';
import type {
  SmsPromptAnchorValue,
  SmsPromptScheduleRepoPort,
} from '../types/smsPromptScheduleRepoPort';
import type {
  LoadForScheduling,
  LoadSchedulerQueryPort,
} from '../types/loadSchedulerQueryPort';
import type { SettingsRepoPort } from '@/settings/types/settingsTypes';

type Handler = (data: never) => Promise<void>;

const makeScheduleRow = (
  overrides: Partial<SmsPromptSchedule> = {},
): SmsPromptSchedule => ({
  id: overrides.id ?? `row-${Math.random().toString(36).slice(2, 8)}`,
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
    markSent: jest.fn(),
    markFailed: jest.fn(),
    findByLoad: jest.fn(),
    lastSentAtForLoad: jest.fn(),
  };

  const loadRepo: jest.Mocked<LoadSchedulerQueryPort> = {
    findForScheduling: jest.fn(),
  };

  const settingsRepo: jest.Mocked<SettingsRepoPort> = {
    findByOrganizationId: jest.fn().mockResolvedValue(null),
    upsert: jest.fn(),
    getOrganizationHq: jest.fn().mockResolvedValue(null),
    updateOrganizationHq: jest.fn().mockResolvedValue(undefined),
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
    deps: { eventBus, scheduleRepo, loadRepo, settingsRepo, logger },
    invokeHandler,
    handlers,
  };
};

const baseLoad = (
  overrides: Partial<LoadForScheduling> = {},
): LoadForScheduling => ({
  id: 'load-1',
  loadNumber: 'LD-001',
  organizationId: 'org-1',
  driverId: 'driver-1',
  status: 'DISPATCHED',
  equipmentType: null,
  stops: [],
  ...overrides,
});

const statusChangePayload = (
  toStatus: string,
  extras: Partial<EventMap['load.status.changed']> = {},
): EventMap['load.status.changed'] => ({
  loadId: 'load-1',
  organizationId: 'org-1',
  loadNumber: 'LD-001',
  fromStatus: 'BOOKED',
  toStatus,
  customerId: null,
  contactEmail: null,
  contactPhone: null,
  contactCcEmails: [],
  ...extras,
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

describe('initializeSmsPromptSchedulerSubscriber', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-01T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('subscribes to load.status.changed and load.checkcall.logged with queueGroup "sms-prompts-service"', async () => {
    // Arrange
    const { deps } = buildMocks();

    // Act
    await initializeSmsPromptSchedulerSubscriber(deps);

    // Assert
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'load.status.changed',
      'sms-prompts-service',
      expect.any(Function),
    );
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'load.checkcall.logged',
      'sms-prompts-service',
      expect.any(Function),
    );
  });

  it('seeds DISPATCHED + PRE_PICKUP + POST_PICKUP when transitioning to DISPATCHED', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    const appointmentStart = new Date('2026-05-01T16:00:00Z'); // 6h out
    const appointmentEnd = new Date('2026-05-01T18:00:00Z');
    deps.loadRepo.findForScheduling.mockResolvedValue(
      baseLoad({
        stops: [
          {
            sequence: 1,
            type: 'PICKUP',
            appointmentStart,
            appointmentEnd,
            departureTime: null,
            city: null,
            state: null,
          },
        ],
      }),
    );
    deps.settingsRepo.findByOrganizationId.mockResolvedValue(settingsRow());
    await initializeSmsPromptSchedulerSubscriber(deps);

    // Act
    await invokeHandler(
      'load.status.changed',
      statusChangePayload('DISPATCHED'),
    );

    // Assert
    expect(deps.scheduleRepo.create).toHaveBeenCalledTimes(3);
    const anchors = deps.scheduleRepo.create.mock.calls.map(
      (call) => call[0].anchor,
    );
    expect(anchors).toEqual(['DISPATCHED', 'PRE_PICKUP', 'POST_PICKUP']);

    const dispatchedCall = deps.scheduleRepo.create.mock.calls[0]?.[0];
    const prePickupCall = deps.scheduleRepo.create.mock.calls[1]?.[0];
    const postPickupCall = deps.scheduleRepo.create.mock.calls[2]?.[0];

    expect(dispatchedCall?.scheduledAt.getTime()).toBe(Date.now());
    // prePickup = appointmentStart - 60min
    expect(prePickupCall?.scheduledAt.toISOString()).toBe(
      '2026-05-01T15:00:00.000Z',
    );
    // postPickup = appointmentEnd + 30min
    expect(postPickupCall?.scheduledAt.toISOString()).toBe(
      '2026-05-01T18:30:00.000Z',
    );

    expect(deps.eventBus.publishDelayed).toHaveBeenCalledTimes(3);
  });

  it('skips all seeding when the load has no driver assigned', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    deps.loadRepo.findForScheduling.mockResolvedValue(
      baseLoad({ driverId: null }),
    );
    await initializeSmsPromptSchedulerSubscriber(deps);

    // Act
    await invokeHandler(
      'load.status.changed',
      statusChangePayload('DISPATCHED'),
    );

    // Assert
    expect(deps.scheduleRepo.create).not.toHaveBeenCalled();
    expect(deps.logger.warn).toHaveBeenCalledWith(
      'Skipping SMS prompt seeding — load has no driver',
      expect.any(Object),
    );
  });

  it('skips PRE_PICKUP when no appointmentStart exists but still seeds DISPATCHED', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    deps.loadRepo.findForScheduling.mockResolvedValue(
      baseLoad({
        stops: [],
      }),
    );
    await initializeSmsPromptSchedulerSubscriber(deps);

    // Act
    await invokeHandler(
      'load.status.changed',
      statusChangePayload('DISPATCHED'),
    );

    // Assert
    const anchors = deps.scheduleRepo.create.mock.calls.map(
      (call) => call[0].anchor,
    );
    expect(anchors).toEqual(['DISPATCHED']);
  });

  it('cancels only POST_PICKUP rows when status transitions to AT_PICKUP', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    const pendingRow = makeScheduleRow({ anchor: 'POST_PICKUP', id: 'row-pp' });
    deps.scheduleRepo.findPending.mockResolvedValue([pendingRow]);
    await initializeSmsPromptSchedulerSubscriber(deps);

    // Act
    await invokeHandler('load.status.changed', statusChangePayload('AT_PICKUP'));

    // Assert
    expect(deps.scheduleRepo.findPending).toHaveBeenCalledWith(
      'load-1',
      'POST_PICKUP',
    );
    expect(deps.scheduleRepo.cancel).toHaveBeenCalledWith(
      ['row-pp'],
      'load_arrived_at_pickup',
    );
    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'sms.prompt.canceled',
      expect.objectContaining({
        smsPromptScheduleId: 'row-pp',
        reason: 'load_arrived_at_pickup',
      }),
    );
  });

  it('cancels ALL pending rows when the load is DELIVERED', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    const rows = [
      makeScheduleRow({ id: 'row-a' }),
      makeScheduleRow({ id: 'row-b' }),
    ];
    deps.scheduleRepo.findPending.mockResolvedValue(rows);
    await initializeSmsPromptSchedulerSubscriber(deps);

    // Act
    await invokeHandler(
      'load.status.changed',
      statusChangePayload('DELIVERED'),
    );

    // Assert
    expect(deps.scheduleRepo.findPending).toHaveBeenCalledWith('load-1');
    expect(deps.scheduleRepo.cancel).toHaveBeenCalledWith(
      ['row-a', 'row-b'],
      'load_delivered',
    );
  });

  it('cancels ALL pending rows when the load is CANCELED', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    deps.scheduleRepo.findPending.mockResolvedValue([
      makeScheduleRow({ id: 'row-x' }),
    ]);
    await initializeSmsPromptSchedulerSubscriber(deps);

    // Act
    await invokeHandler('load.status.changed', statusChangePayload('CANCELED'));

    // Assert
    expect(deps.scheduleRepo.cancel).toHaveBeenCalledWith(
      ['row-x'],
      'load_canceled',
    );
  });

  it('cancels ALL pending rows when the load is TONU', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    deps.scheduleRepo.findPending.mockResolvedValue([
      makeScheduleRow({ id: 'row-tonu' }),
    ]);
    await initializeSmsPromptSchedulerSubscriber(deps);

    // Act
    await invokeHandler('load.status.changed', statusChangePayload('TONU'));

    // Assert
    expect(deps.scheduleRepo.cancel).toHaveBeenCalledWith(
      ['row-tonu'],
      'load_tonu',
    );
  });

  it('schedules a single midpoint TRANSIT_INTERVAL when transit duration is under 4 hours', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    const pickupDeparture = new Date('2026-05-01T10:00:00Z');
    const deliveryEta = new Date('2026-05-01T12:00:00Z'); // 2h transit
    deps.loadRepo.findForScheduling.mockResolvedValue(
      baseLoad({
        status: 'IN_TRANSIT',
        stops: [
          {
            sequence: 1,
            type: 'PICKUP',
            appointmentStart: pickupDeparture,
            appointmentEnd: null,
            departureTime: pickupDeparture,
            city: null,
            state: null,
          },
          {
            sequence: 2,
            type: 'DELIVERY',
            appointmentStart: deliveryEta,
            appointmentEnd: null,
            departureTime: null,
            city: null,
            state: null,
          },
        ],
      }),
    );
    await initializeSmsPromptSchedulerSubscriber(deps);

    // Act
    await invokeHandler(
      'load.status.changed',
      statusChangePayload('IN_TRANSIT'),
    );

    // Assert
    expect(deps.scheduleRepo.create).toHaveBeenCalledTimes(1);
    const call = deps.scheduleRepo.create.mock.calls[0]?.[0];
    expect(call?.anchor).toBe('TRANSIT_INTERVAL');
    // Midpoint = pickupDeparture + 1h
    expect(call?.scheduledAt.toISOString()).toBe('2026-05-01T11:00:00.000Z');
  });

  it('schedules a TRANSIT_INTERVAL at now + intervalMinutes for a long trip', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    const pickupDeparture = new Date('2026-05-01T10:00:00Z');
    const deliveryEta = new Date('2026-05-02T10:00:00Z'); // 24h transit
    deps.loadRepo.findForScheduling.mockResolvedValue(
      baseLoad({
        status: 'IN_TRANSIT',
        stops: [
          {
            sequence: 1,
            type: 'PICKUP',
            appointmentStart: pickupDeparture,
            appointmentEnd: null,
            departureTime: pickupDeparture,
            city: null,
            state: null,
          },
          {
            sequence: 2,
            type: 'DELIVERY',
            appointmentStart: deliveryEta,
            appointmentEnd: null,
            departureTime: null,
            city: null,
            state: null,
          },
        ],
      }),
    );
    await initializeSmsPromptSchedulerSubscriber(deps);

    // Act
    await invokeHandler(
      'load.status.changed',
      statusChangePayload('IN_TRANSIT'),
    );

    // Assert
    expect(deps.scheduleRepo.create).toHaveBeenCalledTimes(1);
    const call = deps.scheduleRepo.create.mock.calls[0]?.[0];
    expect(call?.anchor).toBe('TRANSIT_INTERVAL');
    // 180min after now
    expect(call?.scheduledAt.toISOString()).toBe('2026-05-01T13:00:00.000Z');
  });

  it('cancels only the earliest TRANSIT_INTERVAL on a check-call', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    const early = makeScheduleRow({
      id: 'ti-early',
      scheduledAt: new Date('2026-05-01T13:00:00Z'),
      anchor: 'TRANSIT_INTERVAL',
    });
    const later = makeScheduleRow({
      id: 'ti-later',
      scheduledAt: new Date('2026-05-01T16:00:00Z'),
      anchor: 'TRANSIT_INTERVAL',
    });
    deps.scheduleRepo.findPending.mockResolvedValue([early, later]);
    await initializeSmsPromptSchedulerSubscriber(deps);

    const checkCallPayload: EventMap['load.checkcall.logged'] = {
      loadId: 'load-1',
      organizationId: 'org-1',
      loadNumber: 'LD-001',
      checkCallId: 'cc-1',
      customerId: null,
      contactEmail: null,
      contactPhone: null,
      contactCcEmails: [],
      location: null,
      status: null,
      eta: null,
    };

    // Act
    await invokeHandler('load.checkcall.logged', checkCallPayload);

    // Assert
    expect(deps.scheduleRepo.findPending).toHaveBeenCalledWith(
      'load-1',
      'TRANSIT_INTERVAL',
    );
    expect(deps.scheduleRepo.cancel).toHaveBeenCalledWith(
      ['ti-early'],
      'check_call_superseded',
    );
    expect(deps.eventBus.publish).toHaveBeenCalledWith(
      'sms.prompt.canceled',
      expect.objectContaining({ smsPromptScheduleId: 'ti-early' }),
    );
  });

  it('uses default settings when no OrgSettings row exists', async () => {
    // Arrange
    const { deps, invokeHandler } = buildMocks();
    const appointmentStart = new Date('2026-05-01T16:00:00Z');
    const appointmentEnd = new Date('2026-05-01T18:00:00Z');
    deps.loadRepo.findForScheduling.mockResolvedValue(
      baseLoad({
        stops: [
          {
            sequence: 1,
            type: 'PICKUP',
            appointmentStart,
            appointmentEnd,
            departureTime: null,
            city: null,
            state: null,
          },
        ],
      }),
    );
    deps.settingsRepo.findByOrganizationId.mockResolvedValue(null);
    await initializeSmsPromptSchedulerSubscriber(deps);

    // Act
    await invokeHandler(
      'load.status.changed',
      statusChangePayload('DISPATCHED'),
    );

    // Assert — default 60min pre-pickup lead, default 30min post-pickup escalation
    const prePickupCall = deps.scheduleRepo.create.mock.calls.find(
      ([input]: Parameters<SmsPromptScheduleRepoPort['create']>) =>
        input.anchor === ('PRE_PICKUP' as SmsPromptAnchorValue),
    );
    const postPickupCall = deps.scheduleRepo.create.mock.calls.find(
      ([input]: Parameters<SmsPromptScheduleRepoPort['create']>) =>
        input.anchor === ('POST_PICKUP' as SmsPromptAnchorValue),
    );
    expect(prePickupCall?.[0].scheduledAt.toISOString()).toBe(
      '2026-05-01T15:00:00.000Z',
    );
    expect(postPickupCall?.[0].scheduledAt.toISOString()).toBe(
      '2026-05-01T18:30:00.000Z',
    );
  });
});
