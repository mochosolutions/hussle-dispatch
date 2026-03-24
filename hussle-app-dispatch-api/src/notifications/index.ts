import { prisma } from '@/shared/prisma';
import { sharedEventBus } from '@/shared/messaging';
import { createNotificationService, createSmsService } from '@/shared/notifications';
import { logger } from '@/shared/utils/logger';
import { env } from '@/config/env';
import { createNotificationModule } from './compositionRoot';
import { createNotificationRouter } from './routes/notificationRoutes';

const selectEmailBackend = (): 'ses' | 'smtp' | 'console' => {
  if (env.SES_FROM_EMAIL) {
    return 'ses';
  }
  if (env.SMTP_HOST && env.SMTP_HOST !== 'localhost') {
    return 'smtp';
  }
  return 'console';
};

const emailService = createNotificationService(
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
const smsService = createSmsService({ backend: 'console' }, logger);

const notificationModule = createNotificationModule({
  prismaClient: prisma,
  eventBus: sharedEventBus,
  emailService,
  smsService,
  logger,
  trackingBaseUrl: env.TRACKING_BASE_URL,
});

// Initialize subscriber for auto-notifications
notificationModule.initializeSubscriber().catch((error: unknown) => {
  logger.error('Failed to initialize notification subscriber', {
    error: error instanceof Error ? error.message : String(error),
  });
});

export const notificationsRouter = createNotificationRouter(notificationModule.controllers);
export const notificationSettingsService = notificationModule.settingsService;
export const notificationOverrideService = notificationModule.overrideService;
export const trackingTokenService = notificationModule.trackingTokenService;
