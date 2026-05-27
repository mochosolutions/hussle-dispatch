import { env } from '@/config/env';
import { s3Client } from '@/config/s3';
import { sharedEventBus } from '@/shared/messaging';
import { prisma } from '@/shared/prisma';
import { getSignatureProvider, getSignatureService } from '@/shared/signatures';
import { createStorageProvider, type StorageProvider } from '@/shared/storage';
import { logger } from '@/shared/utils/logger';

import { createAgreementsModule } from './compositionRoot';

/**
 * Build a StorageProvider mirroring the construction inside `createApp` so the
 * agreements module can read/write signed PDFs and audit certificates without
 * coupling to the request-scoped provider in `app.ts`.
 */
const buildStorage = (): StorageProvider => {
  if (env.STORAGE_BACKEND === 's3') {
    return createStorageProvider(
      {
        backend: 's3',
        s3Client,
        bucket: env.S3_BUCKET,
        region: env.AWS_REGION,
      },
      logger,
    );
  }

  return createStorageProvider(
    {
      backend: 'local',
      basePath: env.STORAGE_LOCAL_PATH,
      baseUrl: '/api/v1/storage',
    },
    logger,
  );
};

const agreementsModule = createAgreementsModule({
  prisma,
  eventBus: sharedEventBus,
  logger,
  storage: buildStorage(),
  signatureService: getSignatureService(),
  signatureProvider: getSignatureProvider(),
  env: {
    SIGNATURE_PROVIDER: env.SIGNATURE_PROVIDER,
    AGREEMENT_WATCHDOG_INTERVAL_MIN: env.AGREEMENT_WATCHDOG_INTERVAL_MIN,
    AGREEMENT_WATCHDOG_STALE_THRESHOLD_MIN: env.AGREEMENT_WATCHDOG_STALE_THRESHOLD_MIN,
    DOCUSEAL_WEBHOOK_SECRET: env.DOCUSEAL_WEBHOOK_SECRET,
  },
});

agreementsModule.initialize().catch((error: unknown) => {
  logger.error('Failed to initialize agreements module', {
    error: error instanceof Error ? error.message : String(error),
  });
});

export const agreementsRouter = agreementsModule.agreementsRouter;
export const docusealWebhookRouter = agreementsModule.docusealWebhookRouter;
export const agreementsQueries = agreementsModule.queries;
export const stopAgreements = agreementsModule.shutdown;
