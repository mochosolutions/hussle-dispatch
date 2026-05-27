import type { Agreement, AgreementStatus, AgreementTemplateKey, Prisma } from '@prisma/client';

// Re-export Prisma-derived types — the schema is the single source of truth
export type { Agreement, AgreementStatus, AgreementTemplateKey };

export interface CreateAgreementInput {
  organizationId: string;
  carrierId: string;
  templateKey: AgreementTemplateKey;
  providerName: string;
  providerSubmissionId: string | null;
  embedUrl: string | null;
  embedUrlExpiresAt: Date | null;
  signerName: string | null;
  signerEmail: string | null;
  variables: Prisma.InputJsonValue;
  status: AgreementStatus;
  createdByUserId: string | null;
}

export interface UpdateAgreementInput {
  status?: AgreementStatus;
  embedUrl?: string | null;
  embedUrlExpiresAt?: Date | null;
  signedPdfS3Key?: string | null;
  auditCertificateS3Key?: string | null;
  signedPdfSha256?: string | null;
  signedAt?: Date | null;
  declinedAt?: Date | null;
  expiredAt?: Date | null;
  voidedAt?: Date | null;
  voidedByUserId?: string | null;
  voidReason?: string | null;
}

export interface ListAgreementsFilters {
  organizationId: string;
  carrierId?: string;
  status?: AgreementStatus;
  templateKey?: AgreementTemplateKey;
  createdAfter?: Date;
  createdBefore?: Date;
  page?: number;
  limit?: number;
}

export interface CountActivePendingArgs {
  organizationId: string;
  carrierId: string;
  templateKey: AgreementTemplateKey;
}
