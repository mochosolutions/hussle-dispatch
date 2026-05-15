import { randomUUID } from 'node:crypto';

import {
  DISPATCH_AGREEMENT_FIELDS,
  type DispatchAgreementFieldName,
} from '@/agreements/templates/dispatchAgreementFields';
import { NotFoundError, ValidationError } from '@/shared/errors';
import type { SignatureService } from '@/shared/signatures/types';
import type { Logger } from '@/shared/utils/logger';

import { AgreementAlreadyPendingError } from '../errors/agreementErrors';
import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type { AgreementServiceResult } from '../types/agreementServiceResult';
import type { Agreement } from '../types/agreementTypes';

export interface RequestAgreementInput {
  carrierId: string;
  templateKey: 'DISPATCH_AGREEMENT';
  signerName?: string;
  signerEmail?: string;
  correlationId?: string;
  organizationId: string;
  requestingUserId: string;
  orgName: string;
}

/**
 * Cross-module read port — minimal surface needed to hydrate the agreement
 * template variables. The compositionRoot wires the real impl in US-14.
 */
export interface CarrierQueryPort {
  findById(
    id: string,
    organizationId: string,
  ): Promise<{
    id: string;
    legalName: string;
    mcNumber: string;
    dotNumber: string | null;
    primaryContactName: string | null;
    primaryContactEmail: string | null;
  } | null>;
}

export interface RequestAgreementDeps {
  agreementRepo: AgreementRepoPort;
  signatureService: SignatureService;
  carrierQueries: CarrierQueryPort;
  providerName: 'MOCK' | 'DOCUSEAL';
  logger: Logger;
  uuid?: () => string;
  now?: () => Date;
}

/**
 * Generate a dispatch agreement for a carrier:
 *   1. Resolve carrier (org-scoped read)
 *   2. Reject if a PENDING agreement already exists for this template
 *   3. Build typed field values, create signature submission, persist agreement
 *   4. Emit agreement.generated event
 */
export const requestAgreement = async (
  input: RequestAgreementInput,
  deps: RequestAgreementDeps,
): Promise<AgreementServiceResult<Agreement>> => {
  const now = (deps.now ?? (() => new Date()))();
  const uuid = deps.uuid ?? randomUUID;

  const carrier = await deps.carrierQueries.findById(input.carrierId, input.organizationId);
  if (carrier === null) {
    throw new NotFoundError(`Carrier not found: ${input.carrierId}`);
  }

  const pendingCount = await deps.agreementRepo.countActivePending({
    organizationId: input.organizationId,
    carrierId: input.carrierId,
    templateKey: input.templateKey,
  });

  if (pendingCount > 0) {
    throw new AgreementAlreadyPendingError();
  }

  const effectiveDate = now.toISOString().slice(0, 10);

  const variables: Record<DispatchAgreementFieldName, string> = {
    [DISPATCH_AGREEMENT_FIELDS.CARRIER_LEGAL_NAME]: carrier.legalName,
    [DISPATCH_AGREEMENT_FIELDS.CARRIER_MC_NUMBER]: carrier.mcNumber,
    [DISPATCH_AGREEMENT_FIELDS.CARRIER_DOT_NUMBER]: carrier.dotNumber ?? '',
    [DISPATCH_AGREEMENT_FIELDS.DISPATCHER_ORG_NAME]: input.orgName,
    [DISPATCH_AGREEMENT_FIELDS.EFFECTIVE_DATE]: effectiveDate,
  };

  const signerName = input.signerName ?? carrier.primaryContactName ?? carrier.legalName;
  const signerEmail = input.signerEmail ?? carrier.primaryContactEmail;

  if (signerEmail === null || signerEmail === undefined || signerEmail.length === 0) {
    throw new ValidationError(
      'Carrier has no primary contact email; provide signerEmail explicitly',
    );
  }

  const correlationId = input.correlationId ?? uuid();

  const ref = await deps.signatureService.createSubmission(
    {
      templateKey: input.templateKey,
      variables,
      signer: { name: signerName, email: signerEmail },
      metadata: {
        carrierId: input.carrierId,
        organizationId: input.organizationId,
      },
    },
    { correlationId },
  );

  const agreement = await deps.agreementRepo.create({
    organizationId: input.organizationId,
    carrierId: input.carrierId,
    templateKey: input.templateKey,
    providerName: deps.providerName,
    providerSubmissionId: ref.providerSubmissionId,
    embedUrl: ref.embedUrl,
    embedUrlExpiresAt: ref.expiresAt,
    signerName,
    signerEmail,
    variables: { ...variables },
    status: 'PENDING',
    createdByUserId: input.requestingUserId,
  });

  deps.logger.info('Agreement requested', {
    agreementId: agreement.id,
    carrierId: input.carrierId,
    providerSubmissionId: ref.providerSubmissionId,
    correlationId,
  });

  return {
    data: agreement,
    events: [
      {
        type: 'agreement.generated',
        occurredAt: now,
        payload: {
          agreementId: agreement.id,
          organizationId: agreement.organizationId,
          carrierId: agreement.carrierId,
          templateKey: 'DISPATCH_AGREEMENT',
          providerSubmissionId: ref.providerSubmissionId,
          correlationId,
        },
      },
    ],
  };
};
