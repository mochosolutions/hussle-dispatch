import { ConflictError, NotFoundError } from '@/shared/errors';
import type { EventMap } from '@/shared/messaging/eventMap';
import type {
  CarrierApprovalPort,
  CarrierApproved,
  CarrierRejected,
} from '../types/approvalTypes';

const ONBOARDING_COMPLETED = 'COMPLETED' as const;

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

interface ApproveResult {
  data: CarrierApproved;
  event: { name: 'carrier.onboarding.approved'; payload: EventMap['carrier.onboarding.approved'] };
}

interface RejectResult {
  data: CarrierRejected;
  event: { name: 'carrier.onboarding.rejected'; payload: EventMap['carrier.onboarding.rejected'] };
}

interface CarrierApprovalServiceDeps {
  approvalPort: CarrierApprovalPort;
}

export const createCarrierApprovalService = (deps: CarrierApprovalServiceDeps) => ({
  approve: async (input: ApproveInput): Promise<ApproveResult> => {
    const carrier = await deps.approvalPort.findById(input.carrierId, input.organizationId);
    if (carrier === null) {
      throw new NotFoundError('Carrier not found.');
    }

    if (carrier.onboardingStatus !== ONBOARDING_COMPLETED) {
      throw new ConflictError('Carrier onboarding is not completed');
    }

    const updated = await deps.approvalPort.approve(input.carrierId);

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

    if (carrier.onboardingStatus !== ONBOARDING_COMPLETED) {
      throw new ConflictError('Carrier onboarding is not completed');
    }

    const updated = await deps.approvalPort.reject(input.carrierId);

    return {
      data: updated,
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
});
