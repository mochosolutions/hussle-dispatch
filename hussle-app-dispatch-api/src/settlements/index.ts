import { prisma } from '@/shared/prisma';
import { sharedEventBus } from '@/shared/messaging';
import { logger } from '@/shared/utils/logger';
import { createNotificationService } from '@/shared/notifications';
import { createBrowserPool } from '@/shared/providers/puppeteerBrowserPool';
import { env } from '@/config/env';
import { createSettlementModule } from './compositionRoot';
import { createSettlementRouter } from './routes/settlementRoutes';
import { createSettlementCronJob } from './services/settlementCronJob';

const selectEmailBackend = (): 'ses' | 'smtp' | 'console' => {
  if (env.SES_FROM_EMAIL) {
    return 'ses';
  }
  if (env.SMTP_HOST && env.SMTP_HOST !== 'localhost') {
    return 'smtp';
  }
  return 'console';
};

const notificationService = createNotificationService(
  {
    backend: selectEmailBackend(),
    region: env.AWS_REGION,
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  },
  logger,
);

const browserPool = createBrowserPool({
  maxPages: 3,
  logger,
});

const settlementModule = createSettlementModule({
  prismaClient: prisma,
  eventBus: sharedEventBus,
  notificationService,
  fromEmail: env.SES_FROM_EMAIL || 'noreply@hussle.app',
  browserPool,
  logger,
});

/**
 * Start the settlement subscriber and cron job.
 * Returns a stop handle for graceful shutdown.
 * Call this explicitly from startBackground — never at module import time.
 */
export const startSettlements = (): { stop: () => void } => {
  settlementModule.initializeSubscriber().catch((error: unknown) => {
    logger.error('Failed to initialize settlement subscribers', {
      error: error instanceof Error ? error.message : String(error),
    });
  });

  const cronJob = createSettlementCronJob({ prisma, eventBus: sharedEventBus, logger });
  cronJob.start();

  return { stop: () => cronJob.stop() };
};

export const settlementsRouter = createSettlementRouter(settlementModule.controllers);
