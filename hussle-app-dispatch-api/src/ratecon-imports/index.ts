import { DocumentType } from '@prisma/client';

import { env } from '@/config/env';
import { s3Client } from '@/config/s3';
import { sharedEventBus } from '@/shared/messaging';
import { prisma } from '@/shared/prisma';
import { createPythonServiceClient } from '@/shared/python/pythonServiceClient';
import { createStorageProvider } from '@/shared/storage';
import { logger } from '@/shared/utils/logger';

import { createMailpitClient, type MailpitClient } from './adapters/mailpitClient';
import { createRateconImportsModule } from './compositionRoot';
import { createRateconImportRoutes } from './routes/rateconImportRoutes';
import { createRateconWebhookRoutes } from './routes/rateconWebhookRoutes';
import type {
  RateconCustomerLookupPort,
  RateconDocumentPort,
} from './types/rateconImportTypes';

const RATECON_IMPORT_ENTITY_TYPE = 'ratecon_import';

const storageProvider = createStorageProvider(
  env.STORAGE_BACKEND === 's3'
    ? { backend: 's3', s3Client, bucket: env.S3_BUCKET, region: env.AWS_REGION }
    : {
        backend: 'local',
        basePath: env.STORAGE_LOCAL_PATH,
        baseUrl: `http://localhost:${String(env.PORT)}/api/v1/storage`,
      },
  logger,
);

const documentPort: RateconDocumentPort = {
  createConfirmedDocument: async (input) => {
    const doc = await prisma.document.create({
      data: {
        organizationId: input.organizationId,
        entityType: RATECON_IMPORT_ENTITY_TYPE,
        entityId: input.entityId,
        type: DocumentType.BROKER_RATE_CON,
        fileName: input.fileName,
        mimeType: 'application/pdf',
        s3Key: input.s3Key,
        url: input.s3Key,
        uploadStatus: 'confirmed',
        fileSize: input.fileSize,
        ...(input.uploadedByUserId !== undefined && { uploadedByUserId: input.uploadedByUserId }),
      },
      select: { id: true, s3Key: true, entityId: true },
    });
    return doc;
  },
  getById: (documentId, organizationId) =>
    prisma.document.findFirst({
      where: { id: documentId, organizationId },
      select: { id: true, s3Key: true, entityId: true },
    }),
  setEntity: async (documentId, entityType, entityId) => {
    await prisma.document.update({
      where: { id: documentId },
      data: { entityType, entityId },
    });
  },
  remove: async (documentId) => {
    await prisma.document.delete({ where: { id: documentId } });
  },
};

const customerLookup: RateconCustomerLookupPort = {
  findByMcNumber: (organizationId, mcNumber) =>
    prisma.customer.findFirst({
      where: { organizationId, mcNumber, deleted: false },
      select: { id: true },
    }),
};

const pythonClient = createPythonServiceClient({
  baseUrl: env.PYTHON_SERVICE_URL,
  internalToken: env.PYTHON_SERVICE_TOKEN,
  logger,
});

const mailpitClient: MailpitClient | undefined = env.RATECON_DEV_MAILPIT_INBOUND
  ? createMailpitClient({ baseUrl: env.MAILPIT_API_URL, logger })
  : undefined;

const rateconImportsModule = createRateconImportsModule({
  prismaClient: prisma,
  storageProvider,
  eventBus: sharedEventBus,
  pythonClient,
  documentPort,
  customerLookup,
  webhookSecret: env.RATECON_WEBHOOK_SECRET,
  logger,
  ...(mailpitClient !== undefined && { mailpitClient }),
});

rateconImportsModule.initializeSubscriber().catch((error: unknown) => {
  logger.error('Failed to initialize ratecon extraction subscriber', {
    error: error instanceof Error ? error.message : String(error),
  });
});

export const rateconImportsRouter = createRateconImportRoutes(rateconImportsModule.controllers);

export const rateconWebhookRouter = createRateconWebhookRoutes(
  rateconImportsModule.webhookControllers,
  { enableMailpit: rateconImportsModule.mailpitEnabled },
);
