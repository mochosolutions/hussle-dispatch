import type { StorageProvider } from '@/shared/storage';

import type { Agreement } from '../../types/agreementTypes';

const PRESIGN_TTL_SECONDS = 15 * 60;

export interface AgreementArtifactsResponse {
  signedPdfUrl: string;
  auditCertificateUrl: string;
  signedPdfSha256: string;
  signedAt: string;
}

export interface AgreementResponseData {
  id: string;
  organizationId: string;
  carrierId: string;
  templateKey: string;
  providerName: string;
  providerSubmissionId: string | null;
  embedUrl: string | null;
  embedUrlExpiresAt: string | null;
  signerName: string | null;
  signerEmail: string | null;
  status: string;
  createdByUserId: string | null;
  voidedByUserId: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
  signedAt: string | null;
  declinedAt: string | null;
  expiredAt: string | null;
  voidedAt: string | null;
  artifacts: AgreementArtifactsResponse | null;
  mock: boolean;
  variables: Record<string, string>;
  signedFieldsLocked: boolean;
}

export interface AgreementTransformerDeps {
  storage: StorageProvider;
}

const toIso = (date: Date | null): string | null => (date === null ? null : date.toISOString());

/**
 * Convert a persisted Agreement into the public response shape:
 *  - Date fields become ISO strings.
 *  - When status === 'SIGNED' and both S3 keys are present, presign the
 *    signedPdf + audit certificate URLs (15-minute TTL) into `artifacts`.
 *  - `variables` carries the prefilled DocuSeal field values; consumed by the carrier-portal UI's AgreementPrefillSummary.
 */
export const agreementTransformer = async (
  agreement: Agreement,
  deps: AgreementTransformerDeps,
): Promise<AgreementResponseData> => {
  let artifacts: AgreementArtifactsResponse | null = null;

  if (
    agreement.status === 'SIGNED' &&
    agreement.signedPdfS3Key !== null &&
    agreement.auditCertificateS3Key !== null &&
    agreement.signedPdfSha256 !== null &&
    agreement.signedAt !== null
  ) {
    const [signedPdfUrl, auditCertificateUrl] = await Promise.all([
      deps.storage.getPresignedGetUrl(agreement.signedPdfS3Key, PRESIGN_TTL_SECONDS),
      deps.storage.getPresignedGetUrl(agreement.auditCertificateS3Key, PRESIGN_TTL_SECONDS),
    ]);
    artifacts = {
      signedPdfUrl,
      auditCertificateUrl,
      signedPdfSha256: agreement.signedPdfSha256,
      signedAt: agreement.signedAt.toISOString(),
    };
  }

  return {
    id: agreement.id,
    organizationId: agreement.organizationId,
    carrierId: agreement.carrierId,
    templateKey: agreement.templateKey,
    providerName: agreement.providerName,
    providerSubmissionId: agreement.providerSubmissionId,
    embedUrl: agreement.embedUrl,
    embedUrlExpiresAt: toIso(agreement.embedUrlExpiresAt),
    signerName: agreement.signerName,
    signerEmail: agreement.signerEmail,
    status: agreement.status,
    createdByUserId: agreement.createdByUserId,
    voidedByUserId: agreement.voidedByUserId,
    voidReason: agreement.voidReason,
    createdAt: agreement.createdAt.toISOString(),
    updatedAt: agreement.updatedAt.toISOString(),
    signedAt: toIso(agreement.signedAt),
    declinedAt: toIso(agreement.declinedAt),
    expiredAt: toIso(agreement.expiredAt),
    voidedAt: toIso(agreement.voidedAt),
    artifacts,
    mock: agreement.providerName === 'MOCK',
    variables: (agreement.variables as Record<string, string> | null) ?? {},
    // Derived: an agreement locks the company-phase fields once it's SIGNED.
    // The frontend engine (computeStepMode + computeInvalidations) consumes
    // this same predicate; computing it server-side keeps the multi-key endpoint
    // and the cold-load /session endpoint consistent so polling cycles don't
    // erase the lock state.
    signedFieldsLocked: agreement.status === 'SIGNED',
  };
};
