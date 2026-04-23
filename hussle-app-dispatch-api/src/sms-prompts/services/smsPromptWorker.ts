import type { EventBus } from '@/shared/messaging/eventBus';
import type { EventMap } from '@/shared/messaging/eventMap';
import type { Logger } from '@/shared/utils/logger';
import type { SettingsRepoPort } from '@/settings/types/settingsTypes';
import type { SmsService } from '@/shared/notifications/smsService';
import type { TrackingTokenService } from '@/notifications/services/trackingTokenService';
import type { SmsPromptScheduleRepoPort } from '../types/smsPromptScheduleRepoPort';
import type { LoadSchedulerQueryPort } from '../types/loadSchedulerQueryPort';
import type { DriverQueryPort } from '../types/driverQueryPort';
import { resolveSmsSettings } from './resolveSmsSettings';

const QUEUE_GROUP = 'sms-prompts-service';

const TERMINAL_STATUSES = new Set(['DELIVERED', 'CANCELED', 'TONU']);

export interface SmsPromptWorkerDeps {
  eventBus: EventBus;
  scheduleRepo: SmsPromptScheduleRepoPort;
  loadRepo: LoadSchedulerQueryPort;
  driverRepo: DriverQueryPort;
  settingsRepo: SettingsRepoPort;
  trackingTokenService: TrackingTokenService;
  smsService: SmsService;
  logger: Logger;
  trackingBaseUrl: string;
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const processPromptDue = async (
  payload: EventMap['sms.prompt.due'],
  deps: SmsPromptWorkerDeps,
): Promise<void> => {
  const { smsPromptScheduleId, loadId, anchor } = payload;

  try {
    const row = await deps.scheduleRepo.findById(smsPromptScheduleId);
    if (row === null || row.status !== 'PENDING') {
      deps.logger.info('SMS prompt no longer pending — skipping', {
        smsPromptScheduleId,
        status: row?.status ?? 'missing',
      });
      return;
    }

    const load = await deps.loadRepo.findForScheduling(loadId);
    if (load === null) {
      await deps.scheduleRepo.markFailed(smsPromptScheduleId, 'load not found');
      deps.logger.warn('SMS prompt load not found — marked failed', {
        smsPromptScheduleId,
        loadId,
      });
      return;
    }

    if (TERMINAL_STATUSES.has(load.status)) {
      await deps.scheduleRepo.markFailed(
        smsPromptScheduleId,
        'load already terminal',
      );
      deps.logger.info('SMS prompt load is terminal — marked failed', {
        smsPromptScheduleId,
        loadId,
        status: load.status,
      });
      return;
    }

    const settingsRow = await deps.settingsRepo.findByOrganizationId(
      load.organizationId,
    );
    const settings = resolveSmsSettings(settingsRow);

    const lastSentAt = await deps.scheduleRepo.lastSentAtForLoad(loadId);
    if (lastSentAt !== null) {
      const elapsed = Date.now() - lastSentAt.getTime();
      const cooldownMs = settings.cooldownMinutes * 60 * 1000;
      if (elapsed < cooldownMs) {
        await deps.scheduleRepo.markFailed(
          smsPromptScheduleId,
          'cooldown not elapsed',
        );
        deps.logger.info('SMS prompt skipped — cooldown not elapsed', {
          smsPromptScheduleId,
          loadId,
          elapsedMs: elapsed,
          cooldownMs,
        });
        return;
      }
    }

    const driver = await deps.driverRepo.findById(row.driverId);
    if (driver === null || driver.phone === null) {
      await deps.scheduleRepo.markFailed(
        smsPromptScheduleId,
        'driver has no phone',
      );
      deps.logger.warn('SMS prompt skipped — driver has no phone', {
        smsPromptScheduleId,
        loadId,
        driverId: row.driverId,
      });
      return;
    }

    const tokenRecord = await deps.trackingTokenService.getOrCreateDriverToken(
      loadId,
    );
    const url = `${deps.trackingBaseUrl}/driver-portal/${tokenRecord.token}`;
    const body = `Load #${load.loadNumber}: please check in. ${url}`;

    let messageSid: string | null;
    try {
      const result = await deps.smsService.sendSms({ to: driver.phone, body });
      messageSid = result.messageSid;
    } catch (error: unknown) {
      const message = errorMessage(error);
      await deps.scheduleRepo.markFailed(smsPromptScheduleId, message);
      deps.logger.error('SMS prompt send failed', {
        smsPromptScheduleId,
        loadId,
        error: message,
      });
      return;
    }

    await deps.scheduleRepo.markSent(
      smsPromptScheduleId,
      messageSid,
      new Date(),
    );

    deps.logger.info('SMS prompt sent', {
      smsPromptScheduleId,
      loadId,
      anchor,
    });

    // Re-enqueue the next transit interval only while the load is still IN_TRANSIT.
    if (anchor === 'TRANSIT_INTERVAL' && load.status === 'IN_TRANSIT') {
      const nextAt = new Date(
        Date.now() + settings.transitIntervalMinutes * 60 * 1000,
      );
      try {
        const nextRow = await deps.scheduleRepo.create({
          loadId,
          driverId: row.driverId,
          organizationId: load.organizationId,
          anchor: 'TRANSIT_INTERVAL',
          scheduledAt: nextAt,
        });
        await deps.eventBus
          .publishDelayed(
            'sms.prompt.due',
            {
              smsPromptScheduleId: nextRow.id,
              loadId,
              organizationId: load.organizationId,
              anchor: 'TRANSIT_INTERVAL',
            },
            settings.transitIntervalMinutes * 60 * 1000,
          )
          .catch((error: unknown) => {
            deps.logger.error(
              'Failed to enqueue next TRANSIT_INTERVAL prompt',
              {
                error: errorMessage(error),
                smsPromptScheduleId: nextRow.id,
              },
            );
          });
      } catch (error: unknown) {
        deps.logger.error('Failed to re-enqueue TRANSIT_INTERVAL prompt', {
          error: errorMessage(error),
          loadId,
        });
      }
    }
  } catch (error: unknown) {
    const message = errorMessage(error);
    try {
      await deps.scheduleRepo.markFailed(smsPromptScheduleId, message);
    } catch (markError: unknown) {
      deps.logger.error('Failed to mark SMS prompt as failed', {
        error: errorMessage(markError),
        smsPromptScheduleId,
      });
    }
    deps.logger.error('Unhandled error while processing sms.prompt.due', {
      error: message,
      smsPromptScheduleId,
      loadId,
    });
  }
};

export const initializeSmsPromptWorker = async (
  deps: SmsPromptWorkerDeps,
): Promise<void> => {
  await deps.eventBus.subscribe('sms.prompt.due', QUEUE_GROUP, async (data) => {
    await processPromptDue(data, deps);
  });

  deps.logger.info('SMS prompt worker initialized');
};
