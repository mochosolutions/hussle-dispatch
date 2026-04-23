import type { PrismaClient } from '@prisma/client';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import type { SettingsRepoPort } from '@/settings/types/settingsTypes';
import type { SmsService } from '@/shared/notifications/smsService';
import type { TrackingTokenService } from '@/notifications/services/trackingTokenService';
import { smsPromptScheduleRepositoryPrisma } from './repositories/smsPromptScheduleRepositoryPrisma';
import { loadSchedulerQueryPrisma } from './repositories/loadSchedulerQueryPrisma';
import { driverQueryPrisma } from './repositories/driverQueryPrisma';
import { initializeSmsPromptSchedulerSubscriber } from './services/smsPromptSchedulerSubscriber';
import { initializeSmsPromptWorker } from './services/smsPromptWorker';
import { createSmsPromptService } from './services/smsPromptService';
import {
  createSmsPromptController,
  type SmsPromptControllers,
} from './controllers/smsPromptController';
import type { SmsPromptScheduleRepoPort } from './types/smsPromptScheduleRepoPort';

interface SmsPromptsModuleDeps {
  prismaClient: PrismaClient;
  eventBus: EventBus;
  smsService: SmsService;
  trackingTokenService: TrackingTokenService;
  settingsRepo: SettingsRepoPort;
  logger: Logger;
  trackingBaseUrl: string;
}

export interface SmsPromptsModuleExports {
  scheduleRepo: SmsPromptScheduleRepoPort;
  controllers: SmsPromptControllers;
  initializeSubscribers: () => Promise<void>;
}

export const createSmsPromptsModule = (
  deps: SmsPromptsModuleDeps,
): SmsPromptsModuleExports => {
  const scheduleRepo = smsPromptScheduleRepositoryPrisma(deps.prismaClient);
  const loadRepo = loadSchedulerQueryPrisma(deps.prismaClient);
  const driverRepo = driverQueryPrisma(deps.prismaClient);

  const smsPromptService = createSmsPromptService({
    scheduleRepo,
    loadRepo,
    driverRepo,
    settingsRepo: deps.settingsRepo,
    eventBus: deps.eventBus,
    logger: deps.logger,
  });

  const controllers = createSmsPromptController({
    smsPromptService,
    logger: deps.logger,
  });

  const initializeSubscribers = async (): Promise<void> => {
    await initializeSmsPromptSchedulerSubscriber({
      eventBus: deps.eventBus,
      scheduleRepo,
      loadRepo,
      settingsRepo: deps.settingsRepo,
      logger: deps.logger,
    });

    await initializeSmsPromptWorker({
      eventBus: deps.eventBus,
      scheduleRepo,
      loadRepo,
      driverRepo,
      settingsRepo: deps.settingsRepo,
      trackingTokenService: deps.trackingTokenService,
      smsService: deps.smsService,
      logger: deps.logger,
      trackingBaseUrl: deps.trackingBaseUrl,
    });
  };

  return {
    scheduleRepo,
    controllers,
    initializeSubscribers,
  };
};
