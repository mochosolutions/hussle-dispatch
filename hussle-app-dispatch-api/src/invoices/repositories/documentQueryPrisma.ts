import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { DocumentQueryPort } from '../types/documentPacketTypes';

export const documentQueryPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): DocumentQueryPort => ({
  findConfirmedByEntity: async (entityType, entityId) =>
    prisma.document.findMany({
      where: {
        entityType,
        entityId,
        uploadStatus: 'confirmed',
        isArchived: false,
      },
      select: {
        id: true,
        type: true,
        fileName: true,
        mimeType: true,
        s3Key: true,
      },
    }),
});
