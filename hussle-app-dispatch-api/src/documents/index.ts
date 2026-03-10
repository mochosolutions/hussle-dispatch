import { prisma } from '@/shared/prisma';
import { createStorageProvider } from '@/shared/storage';
import { env } from '@/config/env';
import { logger } from '@/shared/utils/logger';
import { createDocumentsModule } from './compositionRoot';
import { createDocumentRoutes } from './routes/documentRoutes';

const storageProvider = createStorageProvider(
  env.STORAGE_BACKEND === 's3'
    ? {
        backend: 's3',
        s3Client: undefined as never, // S3 client injected at app level when ready
        bucket: env.S3_BUCKET,
        region: env.AWS_REGION,
      }
    : {
        backend: 'local',
        basePath: env.STORAGE_LOCAL_PATH,
        baseUrl: '/api/v1/storage',
      },
  logger,
);

const documentsModule = createDocumentsModule({
  prismaClient: prisma,
  storageProvider,
});

export const documentsRouter = createDocumentRoutes(documentsModule.controllers);
