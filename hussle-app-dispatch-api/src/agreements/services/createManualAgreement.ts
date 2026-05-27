import type { AgreementTemplateKey } from '@prisma/client';

import type { Logger } from '@/shared/utils/logger';

import type { CarrierQueryPort } from './requestAgreement';
import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type { AgreementServiceResult } from '../types/agreementServiceResult';
import type { Agreement } from '../types/agreementTypes';
import {
  AgreementAlreadySignedError,
  AgreementPendingExistsError,
  CarrierNotFoundError,
} from '../errors/agreementErrors';

export interface CreateManualAgreementInput {
  organizationId: string;
  carrierId: string;
  templateKey: AgreementTemplateKey;
  /** Storage key (not a URL) of the pre-uploaded signed PDF artifact. */
  signedPdfS3Key: string;
  signerName: string;
  signerEmail: string | null;
  signedAt: Date;
  createdByUserId: string;
}

export interface CreateManualAgreementDeps {
  agreementRepo: AgreementRepoPort;
  carrierQueries: CarrierQueryPort;
  logger: Logger;
}

/**
 * Creates an admin-uploaded `Agreement` row in SIGNED status. Used when a
 * carrier signed an agreement outside the DocuSeal flow (wet-signed PDF
 * received by email, etc.) and an admin uploads it via the carrier detail UI.
 *
 * Conflict semantics:
 *   - Existing PENDING agreement for (carrierId, templateKey) → caller must
 *     void it first.
 *   - Existing non-voided SIGNED agreement for the same pair → "already on file".
 *
 * No event is emitted: the existing `agreement.signed` subscriber expects a
 * DocuSeal submission to call finalize against, which a manual upload doesn't
 * have. Onboarding-gate projections (`dispatchAgreementOnFile`,
 * `dispatchAgreementSignedAt`) are computed on-read from the Agreement table,
 * so nothing else needs to be notified once the row is persisted.
 */
export const createManualAgreement = async (
  input: CreateManualAgreementInput,
  deps: CreateManualAgreementDeps,
): Promise<AgreementServiceResult<Agreement>> => {
  const carrier = await deps.carrierQueries.findById(input.carrierId, input.organizationId);
  if (carrier === null) {
    throw new CarrierNotFoundError(input.carrierId);
  }

  const existing = await deps.agreementRepo.findLatestForCarrier(
    input.carrierId,
    input.templateKey,
  );

  if (existing !== null) {
    if (existing.status === 'PENDING') {
      throw new AgreementPendingExistsError(existing.id);
    }
    if (existing.status === 'SIGNED' && existing.voidedAt === null) {
      throw new AgreementAlreadySignedError(existing.id);
    }
  }

  // Persist the SIGNED draft, then patch the signing artifacts (the
  // CreateAgreementInput shape doesn't include signedPdfS3Key/signedAt).
  const draft = await deps.agreementRepo.create({
    organizationId: input.organizationId,
    carrierId: input.carrierId,
    templateKey: input.templateKey,
    providerName: 'MANUAL',
    providerSubmissionId: null,
    embedUrl: null,
    embedUrlExpiresAt: null,
    signerName: input.signerName,
    signerEmail: input.signerEmail,
    variables: {},
    status: 'SIGNED',
    createdByUserId: input.createdByUserId,
  });

  const updated = await deps.agreementRepo.update(draft.id, {
    signedPdfS3Key: input.signedPdfS3Key,
    signedAt: input.signedAt,
  });

  deps.logger.info('Manual agreement created', {
    agreementId: updated.id,
    carrierId: input.carrierId,
    organizationId: input.organizationId,
    templateKey: input.templateKey,
    signerName: input.signerName,
    createdByUserId: input.createdByUserId,
  });

  return {
    data: updated,
    events: [],
  };
};
