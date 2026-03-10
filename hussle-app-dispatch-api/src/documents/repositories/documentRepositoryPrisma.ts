import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  CreateDocumentData,
  DocumentRepoPort,
  ListDocumentsInput,
} from '../types/documentTypes';
import type { DocumentType } from '@prisma/client';

export const documentRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): DocumentRepoPort => ({
  create: (data: CreateDocumentData) =>
    prisma.document.create({ data }),

  findById: (id: string, organizationId: string) =>
    prisma.document.findFirst({
      where: { id, organizationId },
    }),

  updateUploadStatus: (id: string, status: string) =>
    prisma.document.update({
      where: { id },
      data: { uploadStatus: status },
    }),

  archiveByLoadAndType: async (
    loadId: string,
    type: DocumentType,
    excludeId: string,
  ): Promise<number> => {
    const result = await prisma.document.updateMany({
      where: {
        loadId,
        type,
        id: { not: excludeId },
        isArchived: false,
      },
      data: { isArchived: true },
    });
    return result.count;
  },

  findMany: (filters: ListDocumentsInput) => {
    const where: {
      organizationId: string;
      loadId?: string;
      carrierId?: string;
      type?: DocumentType;
      uploadStatus: string;
      isArchived?: boolean;
    } = {
      organizationId: filters.organizationId,
      uploadStatus: 'confirmed',
    };

    if (filters.loadId !== undefined) {
      where.loadId = filters.loadId;
    }

    if (filters.carrierId !== undefined) {
      where.carrierId = filters.carrierId;
    }

    if (filters.type !== undefined) {
      where.type = filters.type;
    }

    if (filters.includeArchived !== true) {
      where.isArchived = false;
    }

    return prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  },

  updateLoadTimestamp: async (
    loadId: string,
    field: 'rateConReceivedAt' | 'bolUnsignedAt' | 'bolSignedAt',
    timestamp: Date,
  ): Promise<void> => {
    await prisma.load.update({
      where: { id: loadId },
      data: { [field]: timestamp },
    });
  },
});
