import { ForbiddenError, NotFoundError } from '@/shared/errors';
import type { SignatureService } from '@/shared/signatures/types';
import type { Logger } from '@/shared/utils/logger';

import { AgreementNotVoidableError } from '../errors/agreementErrors';
import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type { AgreementServiceResult } from '../types/agreementServiceResult';
import type { Agreement } from '../types/agreementTypes';

export interface VoidAgreementInput {
  agreementId: string;
  organizationId: string;
  requestingUserId: string;
  reason?: string;
}

export interface VoidAgreementDeps {
  agreementRepo: AgreementRepoPort;
  signatureService: SignatureService;
  logger: Logger;
  now?: () => Date;
}

/**
 * Void a PENDING agreement:
 *   1. Load and authorize (org scope)
 *   2. Enforce state machine: only PENDING → VOIDED
 *   3. Call provider voidSubmission (failures propagate)
 *   4. Persist VOIDED status with reason
 *   5. Emit agreement.voided event
 */
export const voidAgreement = async (
  input: VoidAgreementInput,
  deps: VoidAgreementDeps,
): Promise<AgreementServiceResult<Agreement>> => {
  const agreement = await deps.agreementRepo.findById(input.agreementId);

  if (agreement === null) {
    throw new NotFoundError(`Agreement not found: ${input.agreementId}`);
  }

  if (agreement.organizationId !== input.organizationId) {
    throw new ForbiddenError('Agreement does not belong to this organization');
  }

  if (agreement.status !== 'PENDING') {
    throw new AgreementNotVoidableError(agreement.status);
  }

  if (agreement.providerSubmissionId !== null && agreement.providerSubmissionId.length > 0) {
    await deps.signatureService.voidSubmission(agreement.providerSubmissionId);
  }

  const voidedAt = (deps.now ?? (() => new Date()))();
  const voidReason = input.reason ?? null;

  const updated = await deps.agreementRepo.update(agreement.id, {
    status: 'VOIDED',
    voidedAt,
    voidedByUserId: input.requestingUserId,
    voidReason,
  });

  deps.logger.info('Agreement voided', {
    agreementId: updated.id,
    voidedByUserId: input.requestingUserId,
    voidReason,
  });

  return {
    data: updated,
    events: [
      {
        type: 'agreement.voided',
        occurredAt: voidedAt,
        payload: {
          agreementId: updated.id,
          organizationId: updated.organizationId,
          carrierId: updated.carrierId,
          voidedAt: voidedAt.toISOString(),
          voidReason: updated.voidReason,
          voidedByUserId: updated.voidedByUserId,
        },
      },
    ],
  };
};
