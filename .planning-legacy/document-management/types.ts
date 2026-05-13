// Auto-generated from contract.yaml — DO NOT EDIT MANUALLY

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum DocumentType {
  // Existing
  BROKER_RATE_CON = 'BROKER_RATE_CON',
  BOL_UNSIGNED = 'BOL_UNSIGNED',
  BOL_SIGNED = 'BOL_SIGNED',
  DISPATCH_AGREEMENT = 'DISPATCH_AGREEMENT',
  INSURANCE_CERT = 'INSURANCE_CERT',
  W9 = 'W9',
  CARRIER_PACKET = 'CARRIER_PACKET',
  INVOICE = 'INVOICE',
  LUMPER_RECEIPT = 'LUMPER_RECEIPT',
  SCALE_TICKET = 'SCALE_TICKET',
  POD = 'POD',
  HAZMAT = 'HAZMAT',
  LOA = 'LOA',
  DETENTION = 'DETENTION',
  LICENSE = 'LICENSE',
  REGISTRATION = 'REGISTRATION',
  INSPECTION_CERT = 'INSPECTION_CERT',
  OTHER = 'OTHER',
  // Driver pack
  MEDICAL_CARD = 'MEDICAL_CARD',
  MVR = 'MVR',
  DRUG_TEST = 'DRUG_TEST',
  ROAD_TEST_CERT = 'ROAD_TEST_CERT',
  DRIVER_APPLICATION = 'DRIVER_APPLICATION',
  PSP_REPORT = 'PSP_REPORT',
  BACKGROUND_CHECK = 'BACKGROUND_CHECK',
  ANNUAL_REVIEW = 'ANNUAL_REVIEW',
  HAZMAT_ENDORSEMENT = 'HAZMAT_ENDORSEMENT',
  TWIC_CARD = 'TWIC_CARD',
  // Carrier pack
  MC_AUTHORITY = 'MC_AUTHORITY',
  VOIDED_CHECK = 'VOIDED_CHECK',
  NOTICE_OF_ASSIGNMENT = 'NOTICE_OF_ASSIGNMENT',
  BOC3 = 'BOC3',
  IFTA_LICENSE = 'IFTA_LICENSE',
  // Vehicle pack
  TITLE = 'TITLE',
  IFTA_DECAL = 'IFTA_DECAL',
  IRP_CAB_CARD = 'IRP_CAB_CARD',
  MAINTENANCE_RECORD = 'MAINTENANCE_RECORD',
  LEASE_AGREEMENT = 'LEASE_AGREEMENT',
  BIT_INSPECTION = 'BIT_INSPECTION',
  // Load pack
  TEMPERATURE_LOG = 'TEMPERATURE_LOG',
  TONU_DOC = 'TONU_DOC',
  FUEL_RECEIPT = 'FUEL_RECEIPT',
  LOAD_PHOTO = 'LOAD_PHOTO',
}

export enum DocumentEntityType {
  LOAD = 'load',
  CARRIER = 'carrier',
  DRIVER = 'driver',
  VEHICLE = 'vehicle',
}

export enum DocumentUploadStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
}

export enum DocumentMimeType {
  PDF = 'application/pdf',
  PNG = 'image/png',
  JPEG = 'image/jpeg',
  JPG = 'image/jpg',
}

// ---------------------------------------------------------------------------
// Resource shapes
// ---------------------------------------------------------------------------

export interface DocumentMetadata {
  customLabel?: string;
  policyNumber?: string;
  licenseNumber?: string;
  issuingState?: string;
  cdlClass?: string;
  issuingAuthority?: string;
  [key: string]: unknown;
}

export interface DocumentUploader {
  firstName: string;
  lastName: string;
}

export interface Document {
  id: string;
  entityType: DocumentEntityType;
  entityId: string;
  type: DocumentType;
  fileName: string;
  fileSize?: number | null;
  mimeType?: DocumentMimeType | null;
  url?: string | null;
  uploadStatus: DocumentUploadStatus;
  isArchived: boolean;
  uploadedByUserId?: string | null;
  uploadedBy?: DocumentUploader | null;
  expiresAt?: string | null;
  metadata?: DocumentMetadata | null;
  notes?: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Requests / Responses
// ---------------------------------------------------------------------------

export interface PresignDocumentRequest {
  fileName: string;
  mimeType: DocumentMimeType;
  type: DocumentType;
  entityType: DocumentEntityType;
  entityId: string;
  expiresAt?: string | null;
  metadata?: DocumentMetadata;
}

export interface PresignDocumentResponse {
  documentId: string;
  presignedUrl: string;
  expiresIn: number;
}

export interface ConfirmDocumentRequest {
  expiresAt?: string | null;
  metadata?: DocumentMetadata;
}

export interface DocumentResponseEnvelope {
  data: Document;
}

export interface DocumentListResponse {
  data: Document[];
  meta: PaginationMeta;
}

export interface ListDocumentsQuery {
  entityType?: DocumentEntityType;
  entityId?: string;
  type?: DocumentType;
  expiringBefore?: string;
  includeArchived?: boolean;
}

export interface DownloadUrlResponse {
  url: string;
}

export interface BulkDownloadRequest {
  documentIds: string[];
}

export interface BulkDownloadSuccessItem {
  documentId: string;
  fileName: string;
  presignedUrl: string;
}

export interface BulkDownloadErrorItem {
  documentId: string;
  reason: string;
}

export interface BulkDownloadResponse {
  downloads: BulkDownloadSuccessItem[];
  errors: BulkDownloadErrorItem[];
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type DocumentErrorCode =
  | 'DOCUMENT_NOT_FOUND'
  | 'DOCUMENT_UPLOAD_NOT_CONFIRMED'
  | 'DOCUMENT_ALREADY_CONFIRMED';

export interface ErrorItem {
  message: string;
  field?: string;
  code?: DocumentErrorCode | string;
}

export interface ErrorResponse {
  errors: ErrorItem[];
}
