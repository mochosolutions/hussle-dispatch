import type { LoadDocument } from '../../types/loadTypes';

export interface LoadDocumentResponse {
  id: string;
  type: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadStatus: string;
  notes: string | null;
  createdAt: string;
}

export const toLoadDocumentResponse = (doc: LoadDocument): LoadDocumentResponse => ({
  id: doc.id,
  type: doc.type,
  fileName: doc.fileName,
  fileSize: doc.fileSize,
  mimeType: doc.mimeType,
  uploadStatus: doc.uploadStatus,
  notes: doc.notes,
  createdAt: doc.createdAt.toISOString(),
});

export const toLoadDocumentListResponse = (
  docs: LoadDocument[],
): LoadDocumentResponse[] => docs.map(toLoadDocumentResponse);
