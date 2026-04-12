/**
 * Document feature types for the dispatch app.
 *
 * These types model the document API at /api/v1/documents,
 * distinct from the mocho shared library's generic document types.
 */

export enum DocumentType {
  BROKER_RATE_CON = 'BROKER_RATE_CON',
  BOL_UNSIGNED = 'BOL_UNSIGNED',
  BOL_SIGNED = 'BOL_SIGNED',
  LUMPER_RECEIPT = 'LUMPER_RECEIPT',
  SCALE_TICKET = 'SCALE_TICKET',
  INVOICE = 'INVOICE',
  DISPATCH_AGREEMENT = 'DISPATCH_AGREEMENT',
  INSURANCE_CERT = 'INSURANCE_CERT',
  W9 = 'W9',
  CARRIER_PACKET = 'CARRIER_PACKET',
  POD = 'POD',
  HAZMAT = 'HAZMAT',
  LOA = 'LOA',
  DETENTION = 'DETENTION',
  LICENSE = 'LICENSE',
  REGISTRATION = 'REGISTRATION',
  INSPECTION_CERT = 'INSPECTION_CERT',
  OTHER = 'OTHER',
}

export type DocumentEntityType = 'load' | 'carrier' | 'driver' | 'vehicle';

export type UploadStatus =
  | 'idle'
  | 'presigning'
  | 'uploading'
  | 'confirming'
  | 'complete'
  | 'error';

export interface Document {
  id: string;
  organizationId: string;
  entityType: DocumentEntityType;
  entityId: string;
  type: DocumentType;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  s3Url: string;
  uploadStatus: string;
  isArchived: boolean;
  notes: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface DocumentMetadata {
  licenseNumber?: string;
  issuingState?: string;
  cdlClass?: string;
  policyNumber?: string;
  issuingAuthority?: string;
}

export interface BulkDownloadResult {
  downloads: { documentId: string; fileName: string; presignedUrl: string }[];
  errors: { documentId: string; reason: string }[];
}

export interface PresignInput {
  fileName: string;
  mimeType: string;
  type: DocumentType;
  entityType: DocumentEntityType;
  entityId: string;
  expiresAt?: string;
  metadata?: DocumentMetadata;
}

export interface PresignResponse {
  presignedUrl: string;
  documentId: string;
}

export interface ConfirmDocumentInput {
  expiresAt?: string;
  metadata?: DocumentMetadata;
}

export interface ListDocumentsParams {
  entityType?: DocumentEntityType;
  entityId?: string;
  type?: DocumentType;
  expiringBefore?: string;
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
