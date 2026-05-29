import { prisma } from '@/shared/prisma';
import { sharedEventBus } from '@/shared/messaging';
import { smsService, trackingTokenService } from '@/notifications';
import { settingsRepositoryPrisma } from '@/settings/repositories/settingsRepositoryPrisma';
import { logger } from '@/shared/utils/logger';
import { env } from '@/config/env';
import { shortLinkService } from '@/short-links';
import { createSmsPromptsModule } from './compositionRoot';
import { createSmsPromptRoutes } from './routes/smsPromptRoutes';

const settingsRepo = settingsRepositoryPrisma(prisma);

const smsPromptsModule = createSmsPromptsModule({
  prismaClient: prisma,
  eventBus: sharedEventBus,
  smsService,
  trackingTokenService,
  shortLinkService,
  settingsRepo,
  logger,
  trackingBaseUrl: env.TRACKING_BASE_URL,
  publicShortBaseUrl: env.PUBLIC_SHORT_BASE_URL,
});

// Initialize subscribers — call initializeSmsPromptsSubscribers() explicitly
export const initializeSmsPromptsSubscribers = (): Promise<void> =>
  smsPromptsModule.initializeSubscribers().catch((error: unknown) => {
    logger.error('Failed to initialize SMS prompt subscribers', {
      error: error instanceof Error ? error.message : String(error),
    });
  });

export const smsPromptScheduleRepo = smsPromptsModule.scheduleRepo;
export const smsPromptsRouter = createSmsPromptRoutes(
  smsPromptsModule.controllers,
);
