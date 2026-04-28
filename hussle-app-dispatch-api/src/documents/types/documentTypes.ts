import type { DocumentType, Prisma } from '@prisma/client';

// Re-export DocumentType from Prisma — it is the single source of truth
export type { DocumentType } from '@prisma/client';

/**
 * Document with the uploader's name eagerly loaded.
 * This is the canonical shape returned by the repository to callers.
 */
export type DocumentWithUploader = Prisma.DocumentGetPayload<{
  include: {
    uploadedByUser: { select: { firstName: true; lastName: true } };
  };
}>;

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
 * Document types that are "one-per" — only one active (non-archived)
 * document of this type may exist for a given entity at a time.
 *
 * When a new document of one of these types is confirmed, any prior active
 * documents of the same type for the same entity are auto-archived by the
 * documentArchiveSubscriber and a `document.replaced` event is published
 * for each superseded row.
 */
export const ONE_PER_DOCUMENT_TYPES: ReadonlySet<DocumentType> = new Set<DocumentType>([
  'BROKER_RATE_CON',
  'BOL_UNSIGNED',
  'BOL_SIGNED',
  'POD',
  'DISPATCH_AGREEMENT',
  'W9',
  'CARRIER_PACKET',
  'LICENSE',
  'REGISTRATION',
  'INSPECTION_CERT',
  'LOA',
  'MEDICAL_CARD',
  'HAZMAT_ENDORSEMENT',
  'TWIC_CARD',
  'IFTA_LICENSE',
  'IFTA_DECAL',
  'IRP_CAB_CARD',
  'BIT_INSPECTION',
  'MC_AUTHORITY',
  'BOC3',
  'TITLE',
  'LEASE_AGREEMENT',
]);

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
  requestingUserId?: string;
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
  requestingUserId?: string;
}

export type DocumentListItem = Pick<
  DocumentWithUploader,
  | 'id'
  | 'entityType'
  | 'entityId'
  | 'type'
  | 'fileName'
  | 'fileSize'
  | 'mimeType'
  | 'url'
  | 'uploadStatus'
  | 'isArchived'
  | 'uploadedByUserId'
  | 'uploadedByUser'
  | 'expiresAt'
  | 'metadata'
  | 'notes'
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
  url: string;
  uploadStatus: string;
  uploadedByUserId?: string;
  expiresAt?: Date;
  metadata?: Prisma.InputJsonValue;
}

export interface DocumentRepoPort {
  create(data: CreateDocumentData): Promise<DocumentWithUploader>;
  findById(id: string, organizationId: string): Promise<DocumentWithUploader | null>;
  findManyByIds(ids: string[], organizationId: string): Promise<DocumentWithUploader[]>;
  updateUploadStatus(id: string, status: string): Promise<DocumentWithUploader>;
  archiveByEntityAndType(
    entityType: string,
    entityId: string,
    type: DocumentType,
    excludeId: string,
  ): Promise<DocumentWithUploader[]>;
  archive(id: string): Promise<DocumentWithUploader>;
  findMany(filters: ListDocumentsInput): Promise<DocumentWithUploader[]>;
}

// ---------------------------------------------------------------------------
// Cross-module query port for load contact enrichment
// ---------------------------------------------------------------------------

export interface LoadContactQueryPort {
  findById(loadId: string): Promise<{
    id: string;
    loadNumber: string;
    customerId: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    contactCcEmails: string[];
  } | null>;
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
