import { prisma } from '@/shared/prisma';
import { createStorageProvider } from '@/shared/storage';
import { sharedEventBus } from '@/shared/messaging';
import { env } from '@/config/env';
import { s3Client } from '@/config/s3';
import { logger } from '@/shared/utils/logger';
import type { LoadTimestampPort } from './types/loadTimestampPort';
import type { LoadContactQueryPort } from './types/documentTypes';
import { createDocumentsModule } from './compositionRoot';
import { createDocumentRoutes } from './routes/documentRoutes';

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

const loadTimestampPort: LoadTimestampPort = {
  updateTimestamp: async (loadId, field, timestamp) => {
    await prisma.load.update({
      where: { id: loadId },
      data: { [field]: timestamp },
    });
  },
};

const loadContactQuery: LoadContactQueryPort = {
  findById: async (loadId) => {
    const load = await prisma.load.findUnique({
      where: { id: loadId },
      select: {
        id: true,
        loadNumber: true,
        customerId: true,
        contact: {
          select: {
            email: true,
            phone: true,
            ccEmails: true,
          },
        },
      },
    });

    if (load === null) {
      return null;
    }

    return {
      id: load.id,
      loadNumber: load.loadNumber,
      customerId: load.customerId,
      contactEmail: load.contact?.email ?? null,
      contactPhone: load.contact?.phone ?? null,
      contactCcEmails: load.contact?.ccEmails ?? [],
    };
  },
};

const documentsModule = createDocumentsModule({
  prismaClient: prisma,
  storageProvider,
  eventBus: sharedEventBus,
  loadTimestampPort,
  loadContactQuery,
  logger,
});

/**
 * Start both document subscribers.
 * Call this explicitly from startBackground — never at module import time.
 */
export const startDocuments = (): void => {
  documentsModule.initializeSubscriber().catch((error: unknown) => {
    logger.error('Failed to initialize document load timestamp subscriber', {
      error: error instanceof Error ? error.message : String(error),
    });
  });

  documentsModule.initializeArchiveSubscriber().catch((error: unknown) => {
    logger.error('Failed to initialize document archive subscriber', {
      error: error instanceof Error ? error.message : String(error),
    });
  });
};

export const documentsRouter = createDocumentRoutes(documentsModule.controllers);

export const documentService = documentsModule.documentService;
