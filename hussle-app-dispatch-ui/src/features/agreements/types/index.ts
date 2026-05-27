export type AgreementStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'SIGNED'
  | 'VOIDED'
  | 'EXPIRED'
  | 'DECLINED';

export type AgreementTemplateKey = 'DISPATCH_AGREEMENT';

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
  providerName: string;
  providerSubmissionId: string | null;
  embedUrl: string | null;
  embedUrlExpiresAt: string | null;
  signerName: string | null;
  signerEmail: string | null;
  status: AgreementStatus;
  createdByUserId: string | null;
  voidedByUserId: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
  signedAt: string | null;
  declinedAt: string | null;
  expiredAt: string | null;
  voidedAt: string | null;
  artifacts: AgreementArtifacts | null;
  mock: boolean;
  variables: Record<string, string>;
  signedFieldsLocked: boolean;
}

export interface CreateManualAgreementInput {
  carrierId: string;
  templateKey: AgreementTemplateKey;
  signedPdfS3Key: string;
  signerName: string;
  signerEmail?: string;
  signedAt: string;
}

export interface RequestAgreementInput {
  carrierId: string;
  templateKey: AgreementTemplateKey;
  signerName?: string;
  signerEmail?: string;
}

export interface VoidAgreementInput {
  id: string;
  reason: string;
}
