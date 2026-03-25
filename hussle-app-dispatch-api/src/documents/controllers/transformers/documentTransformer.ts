import type { Prisma } from '@prisma/client';
import type { DocumentListItem } from '../../types/documentTypes';

export interface DocumentResponse {
  id: string;
  entityType: string;
  entityId: string;
  type: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadStatus: string;
  isArchived: boolean;
  uploadedByUserId: string | null;
  expiresAt: string | null;
  metadata: Prisma.JsonValue;
  createdAt: string;
}

export interface PresignResponse {
  documentId: string;
  presignedUrl: string;
  expiresIn: number;
}

export const toDocumentResponse = (item: DocumentListItem): DocumentResponse => ({
  id: item.id,
  entityType: item.entityType,
  entityId: item.entityId,
  type: item.type,
  fileName: item.fileName,
  fileSize: item.fileSize,
  mimeType: item.mimeType,
  uploadStatus: item.uploadStatus,
  isArchived: item.isArchived,
  uploadedByUserId: item.uploadedByUserId,
  expiresAt: item.expiresAt ? item.expiresAt.toISOString() : null,
  metadata: item.metadata ?? null,
  createdAt: item.createdAt.toISOString(),
});

export const toDocumentListResponse = (items: DocumentListItem[]): DocumentResponse[] =>
  items.map(toDocumentResponse);
