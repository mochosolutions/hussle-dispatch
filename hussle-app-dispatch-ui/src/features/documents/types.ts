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

export type DocumentEntityType = 'load' | 'carrier' | 'driver' | 'vehicle' | 'invoice';

export type UploadStatus =
  | 'idle'
  | 'presigning'
  | 'uploading'
  | 'confirming'
  | 'complete'
  | 'error';

export interface DocumentUploader {
  firstName: string;
  lastName: string;
}

export interface Document {
  id: string;
  organizationId: string;
  entityType: DocumentEntityType;
  entityId: string;
  type: DocumentType;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  url: string;
  uploadStatus: string;
  isArchived: boolean;
  notes: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
  uploadedByUserId?: string | null;
  uploadedBy?: DocumentUploader | null;
  createdAt: string;
}

export interface DocumentMetadata {
  customLabel?: string;
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
  fileSize: number;
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
  /**
   * Storage key the Document was created at. The dispatcher-side agreements
   * flow needs this to reference the uploaded artifact when persisting an
   * Agreement row via POST /agreements/manual.
   */
  s3Key: string;
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
