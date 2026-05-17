import { CarrierStatus } from '@prisma/client';
import { checkCarrierOnboarding } from '@/shared/onboardingGate';
import type { Logger } from '@/shared/utils/logger';
import { assertTransition } from '../services/carrierStateMachine';
import type { CarrierAuditPort } from '../types/carrierAuditPort';
import type { CarrierForSuspend, CarrierSuspendPort } from '../types/suspendTypes';

export interface DocumentCheckJobDeps {
  carrierQuery: {
    findEligible(): Promise<CarrierForSuspend[]>;
  };
  carrierWriter: Pick<CarrierSuspendPort, 'setStatus'>;
  auditLog: CarrierAuditPort;
  logger: Logger;
}

export interface DocumentCheckJobResult {
  scanned: number;
  toActionRequired: number;
  toActive: number;
  unchanged: number;
}

/**
 * Scans every carrier whose status is governed by the doc gate (ACTIVE or
 * ACTION_REQUIRED) and flips between those two states based on document
 * validity. Other statuses are intentionally untouched — only this job and the
 * unsuspend service own the ACTIVE↔ACTION_REQUIRED edge.
 */
export const runDocumentCheckJob = async (
  deps: DocumentCheckJobDeps,
): Promise<DocumentCheckJobResult> => {
  const carriers = await deps.carrierQuery.findEligible();

  let toActionRequired = 0;
  let toActive = 0;
  let unchanged = 0;

  for (const carrier of carriers) {
    const gate = checkCarrierOnboarding({
      carrierType: carrier.type,
      dispatchAgreementOnFile: carrier.dispatchAgreementOnFile,
      insuranceCertOnFile: carrier.insuranceCertOnFile,
      insuranceExpiry: carrier.insuranceExpiry,
      tinOnFile: carrier.tinOnFile,
    });

    const targetStatus = gate.allowed ? CarrierStatus.ACTIVE : CarrierStatus.ACTION_REQUIRED;

    if (carrier.status === targetStatus) {
      unchanged += 1;
      continue;
    }

    try {
      assertTransition(carrier.status, targetStatus);
    } catch (error: unknown) {
      // Defensive: should not happen because findEligible scopes to
      // ACTIVE | ACTION_REQUIRED. Log and skip rather than abort the job.
      deps.logger.warn('Skipping carrier with unexpected status during doc check', {
        carrierId: carrier.id,
        currentStatus: carrier.status,
        targetStatus,
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    await deps.carrierWriter.setStatus(carrier.id, targetStatus);

    await deps.auditLog
      .create(carrier.managedByOrgId, {
        userId: null,
        action: gate.allowed ? 'CARRIER_DOCUMENTS_VALID' : 'CARRIER_DOCUMENTS_INVALID',
        entityType: 'CARRIER',
        entityId: carrier.id,
        changes: { status: { old: carrier.status, new: targetStatus } },
        metadata: gate.allowed
          ? { source: 'documentCheckJob' }
          : { source: 'documentCheckJob', missingDocuments: gate.missingDocuments },
      })
      .catch(() => undefined);

    if (targetStatus === CarrierStatus.ACTION_REQUIRED) {
      toActionRequired += 1;
    } else {
      toActive += 1;
    }
  }

  deps.logger.info('Document check job complete', {
    scanned: carriers.length,
    toActionRequired,
    toActive,
    unchanged,
  });

  return {
    scanned: carriers.length,
    toActionRequired,
    toActive,
    unchanged,
  };
};
