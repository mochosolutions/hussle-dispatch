import type { CarrierApproved, CarrierRejected } from '../../types/approvalTypes';

export interface ApproveCarrierResponse {
  id: string;
  status: string;
  minimumRatePerMile: number | null;
}

export interface RejectCarrierResponse {
  id: string;
  status: string;
}

export interface AdminActivateCarrierResponse {
  id: string;
  status: string;
  minimumRatePerMile: number | null;
}

export const toApproveCarrierResponse = (carrier: CarrierApproved): ApproveCarrierResponse => ({
  id: carrier.id,
  status: carrier.status,
  minimumRatePerMile:
    carrier.minimumRatePerMile !== null ? Number(carrier.minimumRatePerMile) : null,
});

export const toRejectCarrierResponse = (carrier: CarrierRejected): RejectCarrierResponse => ({
  id: carrier.id,
  status: carrier.status,
});

export const toAdminActivateResponse = (carrier: CarrierApproved): AdminActivateCarrierResponse => ({
  id: carrier.id,
  status: carrier.status,
  minimumRatePerMile:
    carrier.minimumRatePerMile !== null ? Number(carrier.minimumRatePerMile) : null,
});
