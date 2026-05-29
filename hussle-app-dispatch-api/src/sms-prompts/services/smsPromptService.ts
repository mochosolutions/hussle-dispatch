import type { SmsPromptSchedule } from '@prisma/client';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import type { SettingsRepoPort } from '@/settings/types/settingsTypes';
import type { PaginationMeta } from '@/shared/responseEnvelope';
import { buildPaginationMeta } from '@/shared/responseEnvelope';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/shared/errors';
import type { SmsPromptScheduleRepoPort } from '../types/smsPromptScheduleRepoPort';
import type { LoadSchedulerQueryPort } from '../types/loadSchedulerQueryPort';
import type { DriverQueryPort } from '../types/driverQueryPort';
import { resolveSmsSettings } from './resolveSmsSettings';

export interface SmsPromptServiceDeps {
  scheduleRepo: SmsPromptScheduleRepoPort;
  loadRepo: LoadSchedulerQueryPort;
  driverRepo: DriverQueryPort;
  settingsRepo: SettingsRepoPort;
  eventBus: EventBus;
  logger: Logger;
}

export interface SendManualPromptInput {
  loadId: string;
  organizationId: string;
  requestingUserId: string;
  customBody?: string;
}

export interface ListPromptsForLoadInput {
  loadId: string;
  organizationId: string;
  page: number;
  limit: number;
}

export interface ListPromptsForLoadResult {
  data: SmsPromptSchedule[];
  meta: PaginationMeta;
}

export interface SmsPromptService {
  sendManualPrompt(input: SendManualPromptInput): Promise<SmsPromptSchedule>;
  listPromptsForLoad(
    input: ListPromptsForLoadInput,
  ): Promise<ListPromptsForLoadResult>;
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const createSmsPromptService = (
  deps: SmsPromptServiceDeps,
): SmsPromptService => ({
  sendManualPrompt: async (input) => {
    const load = await deps.loadRepo.findForScheduling(input.loadId);
    if (load === null || load.organizationId !== input.organizationId) {
      throw new NotFoundError(`Load with id ${input.loadId} not found`);
    }

    if (load.driverId === null) {
      throw new ValidationError('Load has no assigned driver');
    }

    const driver = await deps.driverRepo.findById(load.driverId);
    if (driver === null || driver.phone === null) {
      throw new ValidationError('Driver has no phone number');
    }

    const settingsRow = await deps.settingsRepo.findByOrganizationId(
      input.organizationId,
    );
    const settings = resolveSmsSettings(settingsRow);

    const lastSentAt = await deps.scheduleRepo.lastSentAtForLoad(input.loadId);
    if (lastSentAt !== null) {
      const elapsedMs = Date.now() - lastSentAt.getTime();
      const cooldownMs = settings.cooldownMinutes * 60 * 1000;
      if (elapsedMs < cooldownMs) {
        throw new ConflictError(
          'Cooldown period not elapsed; try again shortly',
        );
      }
    }

    const row = await deps.scheduleRepo.create({
      loadId: input.loadId,
      driverId: load.driverId,
      organizationId: input.organizationId,
      anchor: 'MANUAL',
      scheduledAt: new Date(),
      customBody: input.customBody ?? null,
    });

    await deps.eventBus
      .publishDelayed(
        'sms.prompt.due',
        {
          smsPromptScheduleId: row.id,
          loadId: input.loadId,
          organizationId: input.organizationId,
          anchor: 'MANUAL',
        },
        0,
      )
      .catch((err: unknown) => {
        deps.logger.error('Failed to publish sms.prompt.due for manual', {
          error: errorMessage(err),
          rowId: row.id,
        });
      });

    deps.logger.info('Manual SMS prompt enqueued', {
      loadId: input.loadId,
      organizationId: input.organizationId,
      requestingUserId: input.requestingUserId,
      smsPromptScheduleId: row.id,
    });

    return row;
  },

  listPromptsForLoad: async (input) => {
    const load = await deps.loadRepo.findForScheduling(input.loadId);
    if (load === null || load.organizationId !== input.organizationId) {
      throw new NotFoundError(`Load with id ${input.loadId} not found`);
    }

    const skip = (input.page - 1) * input.limit;
    const { data, total } = await deps.scheduleRepo.findByLoad(input.loadId, {
      skip,
      take: input.limit,
    });

    const meta = buildPaginationMeta(total, input.page, input.limit);
    return { data, meta };
  },
});
