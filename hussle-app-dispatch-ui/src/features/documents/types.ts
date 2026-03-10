/**
 * Document feature types for the dispatch app.
 *
 * These types model the document API at /api/v1/documents,
 * distinct from the mocho shared library's generic document types.
 */

export type DocumentType =
  | 'BOL'
  | 'POD'
  | 'RATE_CONFIRMATION'
  | 'INSURANCE'
  | 'INVOICE'
  | 'W9'
  | 'CARRIER_AGREEMENT'
  | 'OTHER';

export type UploadStatus = 'idle' | 'presigning' | 'uploading' | 'confirming' | 'complete' | 'error';

export interface Document {
  id: string;
  loadId?: string;
  carrierId?: string;
  documentType: DocumentType;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface PresignInput {
  filename: string;
  mimeType: string;
  size: number;
  documentType: DocumentType;
  loadId?: string;
  carrierId?: string;
}

export interface PresignResponse {
  presignedUrl: string;
  documentId: string;
}

export interface ListDocumentsParams {
  loadId?: string;
  carrierId?: string;
  documentType?: DocumentType;
  page?: number;
  limit?: number;
}

export interface ListDocumentsResponse {
  data: Document[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
