import { prisma } from '@/config/database';
import { env } from '@/config/env';
import { s3Client } from '@/config/s3';
import { sharedEventBus } from '@/shared/messaging/sharedEventBus';
import { createStorageProvider, type StorageProvider } from '@/shared/storage';
import { logger } from '@/shared/utils/logger';
import { agreementsQueries } from '@/agreements';
import { placeServices } from '@/places';
import { documentService } from '@/documents';
import { createCarrierPortalModule } from './compositionRoot';
import { createCarrierPortalRouter } from './routes';

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

const carrierPortalModule = createCarrierPortalModule({
  prismaClient: prisma,
  eventBus: sharedEventBus,
  logger,
  agreementQueries: agreementsQueries,
  storage: buildStorage(),
  addressSearchService: placeServices.addressSearchService,
  documentService,
});

export const carrierPortalRouter = createCarrierPortalRouter(
  carrierPortalModule.controllers,
  carrierPortalModule.middleware,
);
