import type { Prisma } from '@prisma/client';
import type { DocumentListItem } from '../../types/documentTypes';

export interface DocumentUploaderResponse {
  firstName: string;
  lastName: string;
}

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
  uploadedBy: DocumentUploaderResponse | null;
  expiresAt: string | null;
  metadata: Prisma.JsonValue;
  notes: string | null;
  createdAt: string;
}

export interface PresignResponse {
  documentId: string;
  presignedUrl: string;
  expiresIn: number;
  /**
   * The storage key the document was created at. The FE needs this to pass
   * to /agreements/manual (and similar) when the uploaded artifact will be
   * referenced by another domain entity, not just the Document row itself.
   * Safe to expose because the key is org-scoped (`<orgId>/...`) and the
   * download endpoints still enforce per-entity access control.
   */
  s3Key: string;
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
  uploadedBy: item.uploadedByUser
    ? {
        firstName: item.uploadedByUser.firstName,
        lastName: item.uploadedByUser.lastName,
      }
    : null,
  expiresAt: item.expiresAt ? item.expiresAt.toISOString() : null,
  metadata: item.metadata ?? null,
  notes: item.notes ?? null,
  createdAt: item.createdAt.toISOString(),
});

export const toDocumentListResponse = (items: DocumentListItem[]): DocumentResponse[] =>
  items.map(toDocumentResponse);
