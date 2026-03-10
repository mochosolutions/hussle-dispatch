import type { Document } from '@prisma/client';

export interface DocumentResponse {
  id: string;
  loadId: string | null;
  carrierId: string | null;
  type: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadStatus: string;
  isArchived: boolean;
  uploadedByUserId: string | null;
  createdAt: string;
}

export interface PresignResponse {
  documentId: string;
  presignedUrl: string;
  expiresIn: number;
}

export const toDocumentResponse = (document: Document): DocumentResponse => ({
  id: document.id,
  loadId: document.loadId,
  carrierId: document.carrierId,
  type: document.type,
  fileName: document.fileName,
  fileSize: document.fileSize,
  mimeType: document.mimeType,
  uploadStatus: document.uploadStatus,
  isArchived: document.isArchived,
  uploadedByUserId: document.uploadedByUserId,
  createdAt: document.createdAt.toISOString(),
});

export const toDocumentListResponse = (documents: Document[]): DocumentResponse[] =>
  documents.map(toDocumentResponse);
