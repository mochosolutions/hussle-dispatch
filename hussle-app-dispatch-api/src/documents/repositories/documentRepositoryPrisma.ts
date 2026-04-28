import type { Prisma, PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type {
  CreateDocumentData,
  DocumentRepoPort,
  DocumentWithUploader,
  ListDocumentsInput,
} from '../types/documentTypes';
import type { DocumentType } from '@prisma/client';

export const DOCUMENT_INCLUDES = {
  uploadedByUser: { select: { firstName: true, lastName: true } },
} as const satisfies Prisma.DocumentInclude;

export const documentRepositoryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): DocumentRepoPort => ({
  create: (data: CreateDocumentData) =>
    prisma.document.create({ data, include: DOCUMENT_INCLUDES }),

  findById: (id: string, organizationId: string) =>
    prisma.document.findFirst({
      where: { id, organizationId },
      include: DOCUMENT_INCLUDES,
    }),

  findManyByIds: (ids: string[], organizationId: string) =>
    prisma.document.findMany({
      where: { id: { in: ids }, organizationId },
      include: DOCUMENT_INCLUDES,
    }),

  updateUploadStatus: (id: string, status: string) =>
    prisma.document.update({
      where: { id },
      data: { uploadStatus: status },
      include: DOCUMENT_INCLUDES,
    }),

  archive: (id: string) =>
    prisma.document.update({
      where: { id },
      data: { isArchived: true },
      include: DOCUMENT_INCLUDES,
    }),

  archiveByEntityAndType: async (
    entityType: string,
    entityId: string,
    type: DocumentType,
    excludeId: string,
  ): Promise<DocumentWithUploader[]> => {
    const candidates = await prisma.document.findMany({
      where: {
        entityType,
        entityId,
        type,
        id: { not: excludeId },
        isArchived: false,
      },
      include: DOCUMENT_INCLUDES,
    });

    if (candidates.length === 0) {
      return [];
    }

    await prisma.document.updateMany({
      where: { id: { in: candidates.map((doc) => doc.id) } },
      data: { isArchived: true },
    });

    return candidates.map((doc) => ({ ...doc, isArchived: true }));
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
      include: DOCUMENT_INCLUDES,
      orderBy: { createdAt: 'desc' },
    });
  },
});
