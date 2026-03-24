import { prisma } from '@/shared/prisma';
import { sharedEventBus } from '@/shared/messaging';
import { logger } from '@/shared/utils/logger';
import { createNotificationService } from '@/shared/notifications';
import { createStorageProvider } from '@/shared/storage';
import { createBrowserPool } from '@/shared/providers/puppeteerBrowserPool';
import { env } from '@/config/env';
import { s3Client } from '@/config/s3';
import { createInvoiceModule } from './compositionRoot';
import { createInvoiceRouter } from './routes/invoiceRoutes';

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

const storageProvider = createStorageProvider(
  env.STORAGE_BACKEND === 's3'
    ? {
        backend: 's3',
        s3Client,
        bucket: env.S3_BUCKET,
        region: env.AWS_REGION,
      }
    : {
        backend: 'local',
        basePath: env.STORAGE_LOCAL_PATH,
        baseUrl: `http://localhost:${String(env.PORT)}/api/v1/storage`,
      },
  logger,
);

const browserPool = createBrowserPool({
  maxPages: 5,
  logger,
});

const invoiceModule = createInvoiceModule({
  prismaClient: prisma,
  eventBus: sharedEventBus,
  notificationService,
  storageProvider,
  browserPool,
  logger,
});

// Initialize subscribers
invoiceModule.initializeSubscriber().catch((error: unknown) => {
  logger.error('Failed to initialize invoice subscribers', {
    error: error instanceof Error ? error.message : String(error),
  });
});

export const invoicesRouter = createInvoiceRouter(invoiceModule.controllers);
