import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { PortalDocument, PortalDocumentRepoPort } from '../types/portalDocumentsTypes';

const mapDocumentRow = (row: {
  id: string;
  type: string;
  fileName: string;
  url: string;
  reviewStatus: string | null;
  signatureData: string | null;
  signedAt: Date | null;
  createdAt: Date;
}): PortalDocument => ({
  id: row.id,
  documentType: row.type,
  fileName: row.fileName,
  fileUrl: row.url,
  reviewStatus: row.reviewStatus,
  signatureData: row.signatureData,
  signedAt: row.signedAt,
  createdAt: row.createdAt,
});

export const portalDocumentRepoPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): PortalDocumentRepoPort => ({
  listByCarrier: async (carrierId, organizationId) => {
    const rows = await prisma.document.findMany({
      where: { entityType: 'carrier', entityId: carrierId, organizationId, isArchived: false },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapDocumentRow);
  },

  create: async (data) => {
    const row = await prisma.document.create({
      data: {
        organizationId: data.organizationId,
        entityType: data.entityType,
        entityId: data.entityId,
        type: data.type as 'DISPATCH_AGREEMENT' | 'INSURANCE_CERT' | 'W9' | 'CARRIER_PACKET',
        fileName: data.fileName,
        s3Key: data.s3Key,
        url: data.url,
        uploadStatus: data.uploadStatus,
      },
    });
    return mapDocumentRow(row);
  },

  findById: async (id) => {
    const row = await prisma.document.findUnique({ where: { id } });
    if (!row) {
      return null;
    }
    return mapDocumentRow(row);
  },

  findByIdAndCarrier: async (id, carrierId, organizationId) => {
    const row = await prisma.document.findFirst({
      where: { id, entityType: 'carrier', entityId: carrierId, organizationId },
    });
    if (!row) {
      return null;
    }
    return mapDocumentRow(row);
  },

  updateStatus: async (id, data) => {
    const row = await prisma.document.update({
      where: { id },
      data: {
        uploadStatus: data.uploadStatus,
        ...(data.reviewStatus ? { reviewStatus: data.reviewStatus } : {}),
      },
    });
    return mapDocumentRow(row);
  },
});
