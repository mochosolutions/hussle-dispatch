import type { CarrierApproved, CarrierRejected } from '../../types/approvalTypes';

export interface ApproveCarrierResponse {
  id: string;
  status: string;
  onboardingStatus: string;
  minimumRatePerMile: number | null;
}

export interface RejectCarrierResponse {
  id: string;
  onboardingStatus: string;
}

export const toApproveCarrierResponse = (carrier: CarrierApproved): ApproveCarrierResponse => ({
  id: carrier.id,
  status: carrier.status,
  onboardingStatus: carrier.onboardingStatus,
  minimumRatePerMile: carrier.minimumRatePerMile !== null
    ? Number(carrier.minimumRatePerMile)
    : null,
});

export const toRejectCarrierResponse = (carrier: CarrierRejected): RejectCarrierResponse => ({
  id: carrier.id,
  onboardingStatus: carrier.onboardingStatus,
});
