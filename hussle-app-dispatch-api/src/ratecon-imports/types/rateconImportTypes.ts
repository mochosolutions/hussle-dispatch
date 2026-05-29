import type {
  Prisma,
  PendingRateconImport,
  RateconImportSource,
  RateconImportStatus,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Extraction result (shape returned by the Python service, stored as JSON).
// Snake_case keys mirror app/schemas.py:ExtractionResult. Only the fields the
// mapper + denormalization consume are typed here.
// ---------------------------------------------------------------------------

export interface ExtractionReferenceNumber {
  kind: 'LOAD_NUMBER' | 'PO_NUMBER' | 'BOL_NUMBER' | 'PICKUP_NUMBER' | 'ORDER_NUMBER' | 'OTHER';
  value: string;
  label: string;
}

export interface ExtractionStop {
  sequence: number;
  type: string | null;
  facility_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  appointment_date: string | null;
  appointment_date_raw: string | null;
  appointment_time: string | null;
  appointment_time_raw: string | null;
  appointment_end_time: string | null;
  scheduling_type: string | null;
  appointment_number: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  commodity: string | null;
  weight_lbs: number | null;
  piece_count: number | null;
  is_hazmat: boolean | null;
  is_tarp: boolean | null;
  is_temp_controlled: boolean | null;
  notes: string | null;
}

export interface ExtractionCustomer {
  company_name: string | null;
  mc_number: string | null;
  dot_number: string | null;
}

export interface RateconExtractionResult {
  is_ratecon: boolean;
  document_type_guess: string | null;
  extraction_confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  requires_review: boolean;
  warnings: string[];
  customer_rate: number | null;
  customer_rate_raw: string | null;
  equipment_type: string | null;
  commodity: string | null;
  weight_lbs: number | null;
  piece_count: number | null;
  is_hazmat: boolean | null;
  is_tarp: boolean | null;
  is_team_driver: boolean | null;
  reefer_temp_min_f: number | null;
  reefer_temp_max_f: number | null;
  reefer_mode: 'continuous' | 'cycle-sentry' | null;
  reefer_precool_f: number | null;
  dispatcher_notes: string | null;
  driver_instructions: string | null;
  reference_numbers: ExtractionReferenceNumber[];
  stops: ExtractionStop[];
  customer: ExtractionCustomer | null;
  carrier_name_on_doc: string | null;
  carrier_mc_number: string | null;
}

// ---------------------------------------------------------------------------
// Prefill payload — the camelCase shape the Create Load form consumes.
// ---------------------------------------------------------------------------

export interface RateconPrefillStop {
  type: string | null;
  sequence: number;
  facilityName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  appointmentEndTime: string | null;
  schedulingType: string | null;
  appointmentNumber: string | null;
  contactName: string | null;
  contactPhone: string | null;
  commodity: string | null;
  weight: number | null;
  pieceCount: number | null;
  isHazmat: boolean | null;
  isTarp: boolean | null;
  isTempControlled: boolean | null;
  notes: string | null;
}

export interface RateconCustomerHint {
  companyName: string | null;
  mcNumber: string | null;
  dotNumber: string | null;
  matchedCustomerId: string | null;
}

export interface RateconPrefill {
  externalRefNumber: string | null;
  customerRate: number | null;
  equipmentType: string | null;
  commodity: string | null;
  weight: number | null;
  pieceCount: number | null;
  isHazmat: boolean | null;
  isTarp: boolean | null;
  isTeamDriver: boolean | null;
  reeferTempMin: number | null;
  reeferTempMax: number | null;
  reeferMode: 'continuous' | 'cycle-sentry' | null;
  reeferPrecool: number | null;
  dispatcherNotes: string | null;
  driverInstructions: string | null;
  stops: RateconPrefillStop[];
  customerHint: RateconCustomerHint;
}

// ---------------------------------------------------------------------------
// Service inputs
// ---------------------------------------------------------------------------

export interface CreateImportFromDocumentInput {
  organizationId: string;
  documentId: string;
  source: RateconImportSource;
  receivedByUserId?: string;
  emailMessageId?: string;
  emailSubject?: string;
  emailFrom?: string;
  brokerEmail?: string;
}

export interface CreateImportFromBytesInput {
  organizationId: string;
  pdfBytes: Buffer;
  fileName: string;
  source: RateconImportSource;
  receivedByUserId?: string;
  emailMessageId?: string;
  emailSubject?: string;
  emailFrom?: string;
  brokerEmail?: string;
}

export interface ListImportsInput {
  organizationId: string;
  status?: RateconImportStatus;
  includeResolved?: boolean;
}

export interface GetImportInput {
  organizationId: string;
  importId: string;
}

export interface AcceptImportInput {
  organizationId: string;
  importId: string;
  loadId: string;
  acceptedByUserId?: string;
}

export interface RejectImportInput {
  organizationId: string;
  importId: string;
  rejectedByUserId?: string;
}

export interface RetryImportInput {
  organizationId: string;
  importId: string;
}

// Repository write shape (subset of Prisma create input the service controls)
export interface CreateRateconImportData {
  id?: string;
  organizationId: string;
  source: RateconImportSource;
  status: RateconImportStatus;
  documentId: string;
  receivedByUserId?: string;
  emailMessageId?: string;
  emailSubject?: string;
  emailFrom?: string;
  brokerEmail?: string;
}

export interface UpdateRateconImportData {
  status?: RateconImportStatus;
  extractionResult?: Prisma.InputJsonValue;
  extractionConfidence?: string | null;
  requiresReview?: boolean;
  warnings?: string[];
  isRatecon?: boolean | null;
  documentTypeGuess?: string | null;
  failureReason?: string | null;
  matchedCustomerId?: string | null;
  brokerName?: string | null;
  laneSummary?: string | null;
  customerRate?: Prisma.Decimal | number | null;
  pickupDate?: Date | null;
  extractionStartedAt?: Date | null;
  extractionCompletedAt?: Date | null;
  acceptedLoadId?: string | null;
  acceptedAt?: Date | null;
  rejectedByUserId?: string | null;
  rejectedAt?: Date | null;
  deletedAt?: Date | null;
}

// ---------------------------------------------------------------------------
// Ports
// ---------------------------------------------------------------------------

export interface RateconImportRepoPort {
  create(data: CreateRateconImportData): Promise<PendingRateconImport>;
  findById(importId: string, organizationId: string): Promise<PendingRateconImport | null>;
  findMany(filters: ListImportsInput): Promise<PendingRateconImport[]>;
  update(
    importId: string,
    organizationId: string,
    data: UpdateRateconImportData,
  ): Promise<PendingRateconImport>;
  existsByMessageId(organizationId: string, emailMessageId: string): Promise<boolean>;
}

export interface RateconDocumentRef {
  id: string;
  s3Key: string;
  entityId: string;
}

/**
 * Cross-module access to the Document table, implemented inline in index.ts
 * (mirrors the LoadContactQueryPort pattern in the documents module).
 */
export interface RateconDocumentPort {
  createConfirmedDocument(input: {
    organizationId: string;
    entityId: string;
    fileName: string;
    s3Key: string;
    fileSize: number;
    uploadedByUserId?: string;
  }): Promise<RateconDocumentRef>;
  getById(documentId: string, organizationId: string): Promise<RateconDocumentRef | null>;
  setEntity(documentId: string, entityType: string, entityId: string): Promise<void>;
  remove(documentId: string): Promise<void>;
}

export interface RateconCustomerLookupPort {
  findByMcNumber(organizationId: string, mcNumber: string): Promise<{ id: string } | null>;
}

export type { PendingRateconImport, RateconImportStatus, RateconImportSource };
