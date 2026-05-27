import { ForbiddenError, NotFoundError } from '@/shared/errors';
import type { Logger } from '@/shared/utils/logger';

import type { AgreementRepoPort } from '../types/agreementRepoPort';
import type { AgreementServiceResult } from '../types/agreementServiceResult';
import type { Agreement } from '../types/agreementTypes';

export interface MockSignAgreementInput {
  agreementId: string;
  carrierId: string;
}

export interface MockSignAgreementDeps {
  agreementRepo: AgreementRepoPort;
  markSigned: (providerSubmissionId: string) => void;
  logger: Logger;
  now?: () => Date;
}

/**
 * Dev-only mock-sign service. Bypasses DocuSeal entirely by:
 *   1. Validating ownership (agreement.carrierId === input.carrierId).
 *   2. Calling the mock signature provider's `__testHelpers.markSigned` to
 *      flip its internal state so subsequent `getSubmission` calls return
 *      'signed' (matches what the production webhook would have done).
 *   3. Updating the Agreement row to status=SIGNED with signedAt=now.
 *
 * No event is emitted. The agreement.signed event is normally fired by the
 * docusealWebhookController for production, which kicks off finalizeAgreement
 * (artifact upload, carrier compliance flags). For the dev-mock path we keep
 * it simple: the row flip is enough to drive the carrier-portal UI through
 * the "signed" branch. Mock mode is dev-only and doesn't need the artifact
 * pipeline.
 */
export const mockSignAgreement = async (
  input: MockSignAgreementInput,
  deps: MockSignAgreementDeps,
): Promise<AgreementServiceResult<Agreement>> => {
  const now = (deps.now ?? (() => new Date()))();

  const agreement = await deps.agreementRepo.findById(input.agreementId);
  if (agreement === null) {
    throw new NotFoundError(`Agreement not found: ${input.agreementId}`);
  }

  if (agreement.carrierId !== input.carrierId) {
    throw new ForbiddenError('Agreement is not owned by this carrier session');
  }

  // The mock provider keeps submissions in an in-memory Map that is wiped
  // when the dev process restarts (Docker reload, ts-node-dev rebuild). The
  // Agreement row in PG outlives that, so the providerSubmissionId may not be
  // registered with the live provider instance. Best-effort: log the gap and
  // proceed with the DB flip — the carrier-portal polling loop reads status
  // from the DB row, not from signatureService.getSubmission, so the user-
  // facing flow still completes correctly.
  if (agreement.providerSubmissionId !== null) {
    try {
      deps.markSigned(agreement.providerSubmissionId);
    } catch (error: unknown) {
      deps.logger.warn('Mock provider had no record of submission; proceeding with DB flip only', {
        agreementId: agreement.id,
        providerSubmissionId: agreement.providerSubmissionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const updated = await deps.agreementRepo.update(agreement.id, {
    status: 'SIGNED',
    signedAt: now,
  });

  deps.logger.info('Mock-signed agreement', {
    agreementId: updated.id,
    carrierId: updated.carrierId,
    providerSubmissionId: updated.providerSubmissionId,
  });

  return { data: updated, events: [] };
};
