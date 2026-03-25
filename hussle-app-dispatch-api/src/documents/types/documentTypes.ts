import type { Document, DocumentType } from '@prisma/client';

// Re-export DocumentType from Prisma — it is the single source of truth
export type { DocumentType } from '@prisma/client';

/**
 * Allowed MIME types for document uploads.
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Maximum file sizes in bytes, keyed by MIME category.
 */
export const MAX_FILE_SIZES: Record<string, number> = {
  'application/pdf': 5 * 1024 * 1024, // 5 MB
  'image/png': 10 * 1024 * 1024, // 10 MB
  'image/jpeg': 10 * 1024 * 1024, // 10 MB
  'image/jpg': 10 * 1024 * 1024, // 10 MB
};

/**
 * Default presigned URL expiration in seconds.
 */
export const PRESIGN_EXPIRATION_SECONDS = 900;

export const UPLOAD_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
} as const;

export type UploadStatus = (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];

/**
 * Polymorphic entity types that documents can be attached to.
 */
export const DOCUMENT_ENTITY_TYPES = ['load', 'carrier', 'driver', 'vehicle'] as const;
export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];

/**
 * Flexible metadata for compliance and domain-specific document fields.
 */
export interface DocumentMetadata {
  licenseNumber?: string;
  issuingState?: string;
  cdlClass?: string;
  policyNumber?: string;
  issuingAuthority?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Service input / output types
// ---------------------------------------------------------------------------

export interface PresignInput {
  organizationId: string;
  fileName: string;
  mimeType: string;
  entityType: DocumentEntityType;
  entityId: string;
  type: DocumentType;
  uploadedByUserId?: string;
  expiresAt?: string;
  metadata?: DocumentMetadata;
}

export interface PresignResult {
  documentId: string;
  presignedUrl: string;
  expiresIn: number;
}

export interface ConfirmInput {
  documentId: string;
  organizationId: string;
  expiresAt?: string;
  metadata?: DocumentMetadata;
}

export interface ListDocumentsInput {
  organizationId: string;
  entityType?: DocumentEntityType;
  entityId?: string;
  type?: string;
  expiringBefore?: Date;
  includeArchived?: boolean;
}

export interface GetDocumentInput {
  id: string;
  organizationId: string;
}

export interface DownloadDocumentInput {
  id: string;
  organizationId: string;
}

export interface ArchiveDocumentInput {
  id: string;
  organizationId: string;
}

export type DocumentListItem = Pick<
  Document,
  | 'id'
  | 'entityType'
  | 'entityId'
  | 'type'
  | 'fileName'
  | 'fileSize'
  | 'mimeType'
  | 'uploadStatus'
  | 'isArchived'
  | 'uploadedByUserId'
  | 'expiresAt'
  | 'metadata'
  | 'createdAt'
>;

// ---------------------------------------------------------------------------
// Repository port
// ---------------------------------------------------------------------------

export interface CreateDocumentData {
  organizationId: string;
  entityType: string;
  entityId: string;
  type: DocumentType;
  fileName: string;
  mimeType: string;
  s3Key: string;
  s3Url: string;
  uploadStatus: string;
  uploadedByUserId?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface DocumentRepoPort {
  create(data: CreateDocumentData): Promise<Document>;
  findById(id: string, organizationId: string): Promise<Document | null>;
  findManyByIds(ids: string[], organizationId: string): Promise<Document[]>;
  updateUploadStatus(id: string, status: string): Promise<Document>;
  archiveByEntityAndType(
    entityType: string,
    entityId: string,
    type: DocumentType,
    excludeId: string,
  ): Promise<number>;
  archive(id: string): Promise<Document>;
  findMany(filters: ListDocumentsInput): Promise<Document[]>;
}

// ---------------------------------------------------------------------------
// Bulk operations
// ---------------------------------------------------------------------------

export interface BulkDownloadInput {
  organizationId: string;
  documentIds: string[];
}

export interface BulkDownloadResult {
  downloads: Array<{ documentId: string; fileName: string; presignedUrl: string }>;
  errors: Array<{ documentId: string; reason: string }>;
}
