import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { StorageProvider } from '@/shared/storage';
import type { EventBus } from '@/shared/messaging';
import type { Logger } from '@/shared/utils/logger';
import type { LoadTimestampPort } from './types/loadTimestampPort';
import type { DocumentService } from './types/documentServiceTypes';
import { createDocumentControllers } from './controllers/documentController';
import type { DocumentControllers } from './controllers/documentController';
import { createBulkDownloadController } from './controllers/bulkDownloadController';
import { documentRepositoryPrisma } from './repositories/documentRepositoryPrisma';
import { createDocumentService } from './services/documentService';
import { createLoadTimestampSubscriber } from './services/loadTimestampSubscriber';

interface DocumentModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  storageProvider: StorageProvider;
  eventBus: EventBus;
  loadTimestampPort: LoadTimestampPort;
  logger: Logger;
}

export const createDocumentsModule = ({
  prismaClient,
  storageProvider,
  eventBus,
  loadTimestampPort,
  logger,
}: DocumentModuleDeps): {
  controllers: DocumentControllers;
  documentService: DocumentService;
  initializeSubscriber: () => Promise<void>;
} => {
  const documentRepository = documentRepositoryPrisma(prismaClient);

  const documentService = createDocumentService({
    documentRepository,
    storageProvider,
    eventBus,
  });

  const baseControllers = createDocumentControllers({
    documentService,
  });

  const controllers: DocumentControllers = {
    ...baseControllers,
    bulkDownload: createBulkDownloadController({ documentService }),
  };

  const initializeSubscriber = async () => {
    await createLoadTimestampSubscriber({
      eventBus,
      documentRepository,
      loadTimestampPort,
      logger,
    });
  };

  return { controllers, documentService, initializeSubscriber };
};
