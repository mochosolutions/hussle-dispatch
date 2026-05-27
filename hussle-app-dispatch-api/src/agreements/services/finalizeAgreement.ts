import { createHash } from 'node:crypto';

import { NotFoundError } from '@/shared/errors';
import type { SignatureService } from '@/shared/signatures/types';
import type { StorageProvider } from '@/shared/storage/storageProvider';
import type { Logger } from '@/shared/utils/logger';

import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type { AgreementServiceResult } from '../types/agreementServiceResult';
import type { Agreement } from '../types/agreementTypes';

export interface FinalizeAgreementInput {
  providerSubmissionId: string;
}

export interface FinalizeAgreementDeps {
  agreementRepo: AgreementRepoPort;
  signatureService: SignatureService;
  storage: StorageProvider;
  logger: Logger;
  now?: () => Date;
}

const SIGNED_PDF_CONTENT_TYPE = 'application/pdf';

const buildSignedPdfKey = (agreement: Agreement): string =>
  `orgs/${agreement.organizationId}/carriers/${agreement.carrierId}/agreements/${agreement.id}/signed.pdf`;

const buildAuditCertKey = (agreement: Agreement): string =>
  `orgs/${agreement.organizationId}/carriers/${agreement.carrierId}/agreements/${agreement.id}/audit-certificate.pdf`;

/**
 * Finalize a signed agreement — IDEMPOTENT.
 *
 * If the agreement is already SIGNED, returns the existing row with no events,
 * no provider calls, and no storage writes. This is the contract: webhook
 * deliveries are at-least-once.
 *
 * Otherwise:
 *   1. Fetch signed PDF + audit certificate from provider
 *   2. SHA-256 the signed PDF
 *   3. Upload both artifacts to storage
 *   4. Persist artifact metadata + SIGNED status
 *   5. Emit agreement.finalized event
 */
export const finalizeAgreement = async (
  input: FinalizeAgreementInput,
  deps: FinalizeAgreementDeps,
): Promise<AgreementServiceResult<Agreement>> => {
  const agreement = await deps.agreementRepo.findByProviderSubmissionId(input.providerSubmissionId);

  if (agreement === null) {
    throw new NotFoundError(`Agreement not found for submission: ${input.providerSubmissionId}`);
  }

  if (agreement.status === 'SIGNED') {
    deps.logger.info('finalizeAgreement skipped — already SIGNED (idempotent)', {
      agreementId: agreement.id,
      providerSubmissionId: input.providerSubmissionId,
    });
    return { data: agreement, events: [] };
  }

  const artifacts = await deps.signatureService.fetchSignedArtifacts(input.providerSubmissionId);

  const signedPdfSha256 = createHash('sha256').update(artifacts.signedPdf).digest('hex');

  const signedPdfS3Key = buildSignedPdfKey(agreement);
  const auditCertificateS3Key = buildAuditCertKey(agreement);

  await deps.storage.put(signedPdfS3Key, artifacts.signedPdf, SIGNED_PDF_CONTENT_TYPE);
  await deps.storage.put(auditCertificateS3Key, artifacts.auditCertificate, SIGNED_PDF_CONTENT_TYPE);

  const signedAt = (deps.now ?? (() => new Date()))();

  const updated = await deps.agreementRepo.update(agreement.id, {
    status: 'SIGNED',
    signedAt,
    signedPdfS3Key,
    auditCertificateS3Key,
    signedPdfSha256,
  });

  deps.logger.info('Agreement finalized', {
    agreementId: updated.id,
    providerSubmissionId: input.providerSubmissionId,
    signedPdfSha256,
  });

  return {
    data: updated,
    events: [
      {
        type: 'agreement.finalized',
        occurredAt: signedAt,
        payload: {
          agreementId: updated.id,
          organizationId: updated.organizationId,
          carrierId: updated.carrierId,
          signedPdfS3Key,
          auditCertificateS3Key,
          signedPdfSha256,
        },
      },
    ],
  };
};
