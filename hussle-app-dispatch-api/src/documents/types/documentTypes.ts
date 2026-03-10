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

// ---------------------------------------------------------------------------
// Service input / output types
// ---------------------------------------------------------------------------

export interface PresignInput {
  organizationId: string;
  fileName: string;
  mimeType: string;
  loadId?: string;
  carrierId?: string;
  type: DocumentType;
  uploadedByUserId?: string;
}

export interface PresignResult {
  documentId: string;
  presignedUrl: string;
  expiresIn: number;
}

export interface ConfirmInput {
  documentId: string;
  organizationId: string;
}

export interface ListDocumentsInput {
  organizationId: string;
  loadId?: string;
  carrierId?: string;
  type?: DocumentType;
  includeArchived?: boolean;
}

export interface DocumentListItem {
  id: string;
  loadId: string | null;
  carrierId: string | null;
  type: DocumentType;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadStatus: string;
  isArchived: boolean;
  uploadedByUserId: string | null;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Repository port
// ---------------------------------------------------------------------------

export interface CreateDocumentData {
  organizationId: string;
  loadId?: string;
  carrierId?: string;
  type: DocumentType;
  fileName: string;
  mimeType: string;
  s3Key: string;
  s3Url: string;
  uploadStatus: string;
  uploadedByUserId?: string;
}

export interface DocumentRepoPort {
  create(data: CreateDocumentData): Promise<Document>;
  findById(id: string, organizationId: string): Promise<Document | null>;
  updateUploadStatus(id: string, status: string): Promise<Document>;
  archiveByLoadAndType(loadId: string, type: DocumentType, excludeId: string): Promise<number>;
  findMany(filters: ListDocumentsInput): Promise<Document[]>;
  updateLoadTimestamp(
    loadId: string,
    field: 'rateConReceivedAt' | 'bolUnsignedAt' | 'bolSignedAt',
    timestamp: Date,
  ): Promise<void>;
}
