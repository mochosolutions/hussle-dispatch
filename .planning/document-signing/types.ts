// Auto-generated from contract.yaml — DO NOT EDIT MANUALLY

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export enum AgreementStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SIGNED = 'SIGNED',
  VOIDED = 'VOIDED',
  EXPIRED = 'EXPIRED',
  DECLINED = 'DECLINED',
}

export enum AgreementTemplateKey {
  DISPATCH_AGREEMENT = 'DISPATCH_AGREEMENT',
}

export enum DocuSealEventType {
  FORM_COMPLETED = 'form.completed',
  FORM_DECLINED = 'form.declined',
  FORM_EXPIRED = 'form.expired',
  FORM_VIEWED = 'form.viewed',
}

export enum SignatureProviderName {
  MOCK = 'MOCK',
  DOCUSEAL = 'DOCUSEAL',
}

// ─────────────────────────────────────────────
// Common
// ─────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ErrorDetail {
  message: string;
  field?: string;
  code?: string;
}

export interface ErrorResponse {
  errors: ErrorDetail[];
}

// ─────────────────────────────────────────────
// Agreement Resources
// ─────────────────────────────────────────────

export interface AgreementArtifacts {
  signedPdfUrl: string;
  auditCertificateUrl: string;
  signedPdfSha256: string;
  signedAt: string;
}

export interface Agreement {
  id: string;
  organizationId: string;
  carrierId: string;
  templateKey: AgreementTemplateKey;
  status: AgreementStatus;
  providerName: SignatureProviderName;
  providerSubmissionId?: string | null;
  embedUrl?: string | null;
  embedUrlExpiresAt?: string | null;
  signerName?: string | null;
  signerEmail?: string | null;
  variables?: Record<string, string>;
  artifacts?: AgreementArtifacts | null;
  voidedAt?: string | null;
  voidedByUserId?: string | null;
  voidReason?: string | null;
  signedAt?: string | null;
  declinedAt?: string | null;
  expiredAt?: string | null;
  createdAt: string;
  createdByUserId?: string | null;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Requests
// ─────────────────────────────────────────────

export interface AgreementCreateRequest {
  carrierId: string;
  templateKey: AgreementTemplateKey;
  signerName?: string;
  signerEmail?: string;
  correlationId?: string;
}

export interface AgreementVoidRequest {
  reason?: string;
}

export interface ListAgreementsQuery {
  carrierId?: string;
  status?: AgreementStatus;
  templateKey?: AgreementTemplateKey;
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  limit?: number;
}

// ─────────────────────────────────────────────
// Responses
// ─────────────────────────────────────────────

export interface AgreementResponse {
  data: Agreement;
}

export interface AgreementListResponse {
  data: Agreement[];
  pagination: PaginationMeta;
}

// ─────────────────────────────────────────────
// Webhook
// ─────────────────────────────────────────────

export interface DocuSealWebhookDocument {
  url?: string;
  filename?: string;
}

export interface DocuSealWebhookData {
  submission_id: string;
  template_id?: string;
  submitter_email?: string;
  audit_log_url?: string;
  documents?: DocuSealWebhookDocument[];
  [key: string]: unknown;
}

export interface DocuSealWebhookPayload {
  event_type: DocuSealEventType;
  timestamp: string;
  data: DocuSealWebhookData;
  [key: string]: unknown;
}

export interface WebhookAck {
  received: boolean;
  replayed?: boolean;
}
