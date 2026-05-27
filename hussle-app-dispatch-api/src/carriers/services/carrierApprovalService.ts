import { CarrierStatus } from '@prisma/client';
import { NotFoundError } from '@/shared/errors';
import type { EventMap } from '@/shared/messaging/eventMap';
import type {
  CarrierApprovalPort,
  CarrierApproved,
  CarrierRejected,
} from '../types/approvalTypes';
import type { CarrierAuditPort } from '../types/carrierAuditPort';
import { assertTransition } from './carrierStateMachine';

interface ApproveInput {
  carrierId: string;
  organizationId: string;
  userId: string;
}

interface RejectInput {
  carrierId: string;
  organizationId: string;
  userId: string;
  reason: string;
}

interface AdminActivateInput {
  carrierId: string;
  organizationId: string;
  userId: string;
  reason: string;
  evidenceDocumentId?: string;
}

interface ApproveResult {
  data: CarrierApproved;
  event: { name: 'carrier.onboarding.approved'; payload: EventMap['carrier.onboarding.approved'] };
}

interface RejectResult {
  data: CarrierRejected;
  event: { name: 'carrier.onboarding.rejected'; payload: EventMap['carrier.onboarding.rejected'] };
}

interface AdminActivateResult {
  data: CarrierApproved;
}

interface CarrierApprovalServiceDeps {
  approvalPort: CarrierApprovalPort;
  auditLog: CarrierAuditPort;
}

const writeStatusAudit = async (
  deps: CarrierApprovalServiceDeps,
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

export const createCarrierApprovalService = (deps: CarrierApprovalServiceDeps) => ({
  approve: async (input: ApproveInput): Promise<ApproveResult> => {
    const carrier = await deps.approvalPort.findById(input.carrierId, input.organizationId);
    if (carrier === null) {
      throw new NotFoundError('Carrier not found.');
    }

    assertTransition(carrier.status, CarrierStatus.ACTIVE);

    const updated = await deps.approvalPort.setStatus(input.carrierId, CarrierStatus.ACTIVE);

    await writeStatusAudit(deps, {
      organizationId: input.organizationId,
      carrierId: carrier.id,
      userId: input.userId,
      action: 'CARRIER_APPROVED',
      fromStatus: carrier.status,
      toStatus: CarrierStatus.ACTIVE,
    });

    return {
      data: updated,
      event: {
        name: 'carrier.onboarding.approved',
        payload: {
          carrierId: carrier.id,
          organizationId: input.organizationId,
          carrierName: carrier.name,
          carrierEmail: carrier.email ?? '',
          carrierPhone: carrier.phone,
          minimumRatePerMile: Number(carrier.minimumRatePerMile ?? 0),
          approvedByUserId: input.userId,
        },
      },
    };
  },

  reject: async (input: RejectInput): Promise<RejectResult> => {
    const carrier = await deps.approvalPort.findById(input.carrierId, input.organizationId);
    if (carrier === null) {
      throw new NotFoundError('Carrier not found.');
    }

    assertTransition(carrier.status, CarrierStatus.REJECTED);

    const updated = await deps.approvalPort.setStatus(input.carrierId, CarrierStatus.REJECTED);

    await writeStatusAudit(deps, {
      organizationId: input.organizationId,
      carrierId: carrier.id,
      userId: input.userId,
      action: 'CARRIER_REJECTED',
      fromStatus: carrier.status,
      toStatus: CarrierStatus.REJECTED,
      metadata: { reason: input.reason },
    });

    return {
      data: { id: updated.id, status: updated.status },
      event: {
        name: 'carrier.onboarding.rejected',
        payload: {
          carrierId: carrier.id,
          organizationId: input.organizationId,
          carrierName: carrier.name,
          carrierEmail: carrier.email ?? '',
          carrierPhone: carrier.phone,
          rejectionReason: input.reason,
          rejectedByUserId: input.userId,
        },
      },
    };
  },

  adminActivate: async (input: AdminActivateInput): Promise<AdminActivateResult> => {
    const carrier = await deps.approvalPort.findById(input.carrierId, input.organizationId);
    if (carrier === null) {
      throw new NotFoundError('Carrier not found.');
    }

    assertTransition(carrier.status, CarrierStatus.ACTIVE);

    const updated = await deps.approvalPort.setStatus(input.carrierId, CarrierStatus.ACTIVE);

    await writeStatusAudit(deps, {
      organizationId: input.organizationId,
      carrierId: carrier.id,
      userId: input.userId,
      action: 'CARRIER_ADMIN_ACTIVATED',
      fromStatus: carrier.status,
      toStatus: CarrierStatus.ACTIVE,
      metadata: {
        reason: input.reason,
        ...(input.evidenceDocumentId !== undefined && {
          evidenceDocumentId: input.evidenceDocumentId,
        }),
      },
    });

    return { data: updated };
  },
});
