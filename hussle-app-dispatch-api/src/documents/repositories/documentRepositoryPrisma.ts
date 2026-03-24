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

  findManyByIds: (ids: string[], organizationId: string) =>
    prisma.document.findMany({
      where: { id: { in: ids }, organizationId },
    }),

  updateUploadStatus: (id: string, status: string) =>
    prisma.document.update({
      where: { id },
      data: { uploadStatus: status },
    }),

  archive: (id: string) =>
    prisma.document.update({
      where: { id },
      data: { isArchived: true },
    }),

  archiveByEntityAndType: async (
    entityType: string,
    entityId: string,
    type: DocumentType,
    excludeId: string,
  ): Promise<number> => {
    const result = await prisma.document.updateMany({
      where: {
        entityType,
        entityId,
        type,
        id: { not: excludeId },
        isArchived: false,
      },
      data: { isArchived: true },
    });
    return result.count;
  },

  findMany: (filters: ListDocumentsInput) => {
    const where: Record<string, unknown> = {
      organizationId: filters.organizationId,
      uploadStatus: 'confirmed',
    };

    if (filters.entityType !== undefined) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId !== undefined) {
      where.entityId = filters.entityId;
    }

    if (filters.type !== undefined) {
      where.type = filters.type;
    }

    if (filters.expiringBefore !== undefined) {
      where.expiresAt = { lte: filters.expiringBefore };
    }

    if (filters.includeArchived !== true) {
      where.isArchived = false;
    }

    return prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  },
});
