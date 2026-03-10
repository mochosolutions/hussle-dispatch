import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { StorageProvider } from '@/shared/storage';
import { createDocumentControllers } from './controllers/documentController';
import type { DocumentControllers } from './controllers/documentController';
import { documentRepositoryPrisma } from './repositories/documentRepositoryPrisma';
import { createDocumentService } from './services/documentService';

interface DocumentModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  storageProvider: StorageProvider;
}

export const createDocumentsModule = ({
  prismaClient,
  storageProvider,
}: DocumentModuleDeps): {
  controllers: DocumentControllers;
} => {
  const documentRepository = documentRepositoryPrisma(prismaClient);

  const documentService = createDocumentService({
    documentRepository,
    storageProvider,
  });

  const controllers = createDocumentControllers({
    documentService,
  });

  return { controllers };
};
