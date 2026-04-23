import { prisma } from '@/shared/prisma';
import { sharedEventBus } from '@/shared/messaging';
import { smsService, trackingTokenService } from '@/notifications';
import { settingsRepositoryPrisma } from '@/settings/repositories/settingsRepositoryPrisma';
import { logger } from '@/shared/utils/logger';
import { env } from '@/config/env';
import { createSmsPromptsModule } from './compositionRoot';
import { createSmsPromptRoutes } from './routes/smsPromptRoutes';

const settingsRepo = settingsRepositoryPrisma(prisma);

const smsPromptsModule = createSmsPromptsModule({
  prismaClient: prisma,
  eventBus: sharedEventBus,
  smsService,
  trackingTokenService,
  settingsRepo,
  logger,
  trackingBaseUrl: env.TRACKING_BASE_URL,
});

// Initialize subscribers — fire-and-forget; errors are logged, not fatal.
smsPromptsModule.initializeSubscribers().catch((error: unknown) => {
  logger.error('Failed to initialize SMS prompt subscribers', {
    error: error instanceof Error ? error.message : String(error),
  });
});

export const smsPromptScheduleRepo = smsPromptsModule.scheduleRepo;
export const smsPromptsRouter = createSmsPromptRoutes(
  smsPromptsModule.controllers,
);
