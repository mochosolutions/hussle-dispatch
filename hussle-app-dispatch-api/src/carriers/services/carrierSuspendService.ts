import { CarrierStatus } from '@prisma/client';
import { NotFoundError } from '@/shared/errors';
import { checkCarrierOnboarding } from '@/shared/onboardingGate';
import { assertTransition } from './carrierStateMachine';
import type { CarrierAuditPort } from '../types/carrierAuditPort';
import type { CarrierSuspendPort } from '../types/suspendTypes';

interface SuspendInput {
  carrierId: string;
  organizationId: string;
  userId: string;
  reason: string;
}

interface UnsuspendInput {
  carrierId: string;
  organizationId: string;
  userId: string;
}

interface SuspendResult {
  data: { id: string; status: CarrierStatus };
}

interface CarrierSuspendServiceDeps {
  suspendPort: CarrierSuspendPort;
  auditLog: CarrierAuditPort;
}

const writeStatusAudit = async (
  deps: CarrierSuspendServiceDeps,
  args: {
    organizationId: string;
    carrierId: string;
    userId: string;
    action: string;
    fromStatus: CarrierStatus;
    toStatus: CarrierStatus;
    metadata?: Record<string, unknown>;
  },
): Promise<void> => {
  await deps.auditLog
    .create(args.organizationId, {
      userId: args.userId,
      action: args.action,
      entityType: 'CARRIER',
      entityId: args.carrierId,
      changes: { status: { old: args.fromStatus, new: args.toStatus } },
      metadata: args.metadata ?? null,
    })
    .catch(() => undefined);
};

export const createCarrierSuspendService = (deps: CarrierSuspendServiceDeps) => ({
  suspend: async (input: SuspendInput): Promise<SuspendResult> => {
    const carrier = await deps.suspendPort.findById(input.carrierId, input.organizationId);
    if (carrier === null) {
      throw new NotFoundError('Carrier not found.');
    }

    assertTransition(carrier.status, CarrierStatus.SUSPENDED);

    const updated = await deps.suspendPort.setStatus(input.carrierId, CarrierStatus.SUSPENDED);

    await writeStatusAudit(deps, {
      organizationId: input.organizationId,
      carrierId: carrier.id,
      userId: input.userId,
      action: 'CARRIER_SUSPENDED',
      fromStatus: carrier.status,
      toStatus: CarrierStatus.SUSPENDED,
      metadata: { reason: input.reason },
    });

    return { data: updated };
  },

  unsuspend: async (input: UnsuspendInput): Promise<SuspendResult> => {
    const carrier = await deps.suspendPort.findById(input.carrierId, input.organizationId);
    if (carrier === null) {
      throw new NotFoundError('Carrier not found.');
    }

    // Run the doc gate inline so unsuspending lands in the correct state immediately,
    // rather than reading ACTIVE for an hour until the doc-check job catches up.
    const gate = checkCarrierOnboarding({
      carrierType: carrier.type,
      dispatchAgreementOnFile: carrier.dispatchAgreementOnFile,
      insuranceCertOnFile: carrier.insuranceCertOnFile,
      insuranceExpiry: carrier.insuranceExpiry,
      w9OnFile: carrier.w9OnFile,
    });

    const targetStatus = gate.allowed ? CarrierStatus.ACTIVE : CarrierStatus.ACTION_REQUIRED;
    assertTransition(carrier.status, targetStatus);

    const updated = await deps.suspendPort.setStatus(input.carrierId, targetStatus);

    await writeStatusAudit(deps, {
      organizationId: input.organizationId,
      carrierId: carrier.id,
      userId: input.userId,
      action: 'CARRIER_UNSUSPENDED',
      fromStatus: carrier.status,
      toStatus: targetStatus,
      metadata: gate.allowed ? undefined : { missingDocuments: gate.missingDocuments },
    });

    return { data: updated };
  },
});
