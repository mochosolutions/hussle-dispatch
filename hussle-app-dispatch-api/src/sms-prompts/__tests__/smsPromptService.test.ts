import type { OrgSettings, SmsPromptSchedule } from '@prisma/client';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { SettingsRepoPort } from '@/settings/types/settingsTypes';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/shared/errors';
import { createSmsPromptService } from '../services/smsPromptService';
import type { SmsPromptScheduleRepoPort } from '../types/smsPromptScheduleRepoPort';
import type {
  LoadForScheduling,
  LoadSchedulerQueryPort,
} from '../types/loadSchedulerQueryPort';
import type { DriverQueryPort } from '../types/driverQueryPort';

const makeScheduleRow = (
  overrides: Partial<SmsPromptSchedule> = {},
): SmsPromptSchedule => ({
  id: overrides.id ?? 'row-1',
  loadId: overrides.loadId ?? 'load-1',
  driverId: overrides.driverId ?? 'driver-1',
  organizationId: overrides.organizationId ?? 'org-1',
  anchor: overrides.anchor ?? 'MANUAL',
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
  equipmentType: null,
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

const buildMocks = () => {
  const eventBus: EventBus = {
    publish: jest.fn().mockResolvedValue(undefined),
    publishDelayed: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };

  const scheduleRepo: jest.Mocked<SmsPromptScheduleRepoPort> = {
    create: jest.fn(async (input) =>
      makeScheduleRow({
        id: 'row-new',
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
    findByLoad: jest.fn().mockResolvedValue({ data: [], total: 0 }),
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
    getOrganizationHq: jest.fn().mockResolvedValue(null),
    updateOrganizationHq: jest.fn().mockResolvedValue(undefined),
  };

  const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return {
    eventBus,
    scheduleRepo,
    loadRepo,
    driverRepo,
    settingsRepo,
    logger,
  };
};

describe('smsPromptService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-01T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('sendManualPrompt', () => {
    it('creates a MANUAL PENDING row and publishes sms.prompt.due with delay 0', async () => {
      // Arrange
      const mocks = buildMocks();
      const service = createSmsPromptService(mocks);

      // Act
      const row = await service.sendManualPrompt({
        loadId: 'load-1',
        organizationId: 'org-1',
        requestingUserId: 'user-1',
      });

      // Assert
      expect(mocks.scheduleRepo.create).toHaveBeenCalledWith({
        loadId: 'load-1',
        driverId: 'driver-1',
        organizationId: 'org-1',
        anchor: 'MANUAL',
        scheduledAt: expect.any(Date),
        customBody: null,
      });
      expect(row.anchor).toBe('MANUAL');
      expect(row.status).toBe('PENDING');
      expect(mocks.eventBus.publishDelayed).toHaveBeenCalledWith(
        'sms.prompt.due',
        expect.objectContaining({
          smsPromptScheduleId: 'row-new',
          loadId: 'load-1',
          organizationId: 'org-1',
          anchor: 'MANUAL',
        }),
        0,
      );
    });

    it('persists customBody on the schedule when provided', async () => {
      const mocks = buildMocks();
      const service = createSmsPromptService(mocks);

      await service.sendManualPrompt({
        loadId: 'load-1',
        organizationId: 'org-1',
        requestingUserId: 'user-1',
        customBody: 'Custom dispatcher message',
      });

      expect(mocks.scheduleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ customBody: 'Custom dispatcher message' }),
      );
    });

    it('throws NotFoundError when the load does not exist', async () => {
      // Arrange
      const mocks = buildMocks();
      mocks.loadRepo.findForScheduling.mockResolvedValue(null);
      const service = createSmsPromptService(mocks);

      // Act + Assert
      await expect(
        service.sendManualPrompt({
          loadId: 'missing',
          organizationId: 'org-1',
          requestingUserId: 'user-1',
        }),
      ).rejects.toThrow(NotFoundError);
      expect(mocks.scheduleRepo.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when the load belongs to a different org', async () => {
      // Arrange
      const mocks = buildMocks();
      mocks.loadRepo.findForScheduling.mockResolvedValue(
        baseLoad({ organizationId: 'other-org' }),
      );
      const service = createSmsPromptService(mocks);

      // Act + Assert
      await expect(
        service.sendManualPrompt({
          loadId: 'load-1',
          organizationId: 'org-1',
          requestingUserId: 'user-1',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when the load has no assigned driver', async () => {
      // Arrange
      const mocks = buildMocks();
      mocks.loadRepo.findForScheduling.mockResolvedValue(
        baseLoad({ driverId: null }),
      );
      const service = createSmsPromptService(mocks);

      // Act + Assert
      await expect(
        service.sendManualPrompt({
          loadId: 'load-1',
          organizationId: 'org-1',
          requestingUserId: 'user-1',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when the driver has no phone', async () => {
      // Arrange
      const mocks = buildMocks();
      mocks.driverRepo.findById.mockResolvedValue({
        id: 'driver-1',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: null,
      });
      const service = createSmsPromptService(mocks);

      // Act + Assert
      await expect(
        service.sendManualPrompt({
          loadId: 'load-1',
          organizationId: 'org-1',
          requestingUserId: 'user-1',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ConflictError when the last SMS was sent within the cooldown window', async () => {
      // Arrange
      const mocks = buildMocks();
      mocks.scheduleRepo.lastSentAtForLoad.mockResolvedValue(
        new Date(Date.now() - 5 * 60 * 1000), // 5 min ago; cooldown is 15 min
      );
      const service = createSmsPromptService(mocks);

      // Act + Assert
      await expect(
        service.sendManualPrompt({
          loadId: 'load-1',
          organizationId: 'org-1',
          requestingUserId: 'user-1',
        }),
      ).rejects.toThrow(ConflictError);
      expect(mocks.scheduleRepo.create).not.toHaveBeenCalled();
    });

    it('uses the default 15-minute cooldown when OrgSettings row is missing', async () => {
      // Arrange
      const mocks = buildMocks();
      mocks.settingsRepo.findByOrganizationId.mockResolvedValue(null);
      mocks.scheduleRepo.lastSentAtForLoad.mockResolvedValue(
        new Date(Date.now() - 10 * 60 * 1000), // 10 min ago; inside default 15 min
      );
      const service = createSmsPromptService(mocks);

      // Act + Assert
      await expect(
        service.sendManualPrompt({
          loadId: 'load-1',
          organizationId: 'org-1',
          requestingUserId: 'user-1',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('respects a custom cooldown from OrgSettings', async () => {
      // Arrange
      const mocks = buildMocks();
      mocks.settingsRepo.findByOrganizationId.mockResolvedValue(
        settingsRow({ smsCooldownMinutes: 60 }),
      );
      mocks.scheduleRepo.lastSentAtForLoad.mockResolvedValue(
        new Date(Date.now() - 30 * 60 * 1000), // 30 min ago; still inside 60 min
      );
      const service = createSmsPromptService(mocks);

      // Act + Assert
      await expect(
        service.sendManualPrompt({
          loadId: 'load-1',
          organizationId: 'org-1',
          requestingUserId: 'user-1',
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('listPromptsForLoad', () => {
    it('returns paginated data with correct meta when load is in org', async () => {
      // Arrange
      const mocks = buildMocks();
      const rows = [
        makeScheduleRow({ id: 'row-1' }),
        makeScheduleRow({ id: 'row-2' }),
      ];
      mocks.scheduleRepo.findByLoad.mockResolvedValue({
        data: rows,
        total: 5,
      });
      const service = createSmsPromptService(mocks);

      // Act
      const result = await service.listPromptsForLoad({
        loadId: 'load-1',
        organizationId: 'org-1',
        page: 2,
        limit: 2,
      });

      // Assert
      expect(mocks.scheduleRepo.findByLoad).toHaveBeenCalledWith('load-1', {
        skip: 2,
        take: 2,
      });
      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        page: 2,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasMore: true,
      });
    });

    it('throws NotFoundError when the load belongs to a different org', async () => {
      // Arrange
      const mocks = buildMocks();
      mocks.loadRepo.findForScheduling.mockResolvedValue(
        baseLoad({ organizationId: 'other-org' }),
      );
      const service = createSmsPromptService(mocks);

      // Act + Assert
      await expect(
        service.listPromptsForLoad({
          loadId: 'load-1',
          organizationId: 'org-1',
          page: 1,
          limit: 25,
        }),
      ).rejects.toThrow(NotFoundError);
      expect(mocks.scheduleRepo.findByLoad).not.toHaveBeenCalled();
    });
  });
});
