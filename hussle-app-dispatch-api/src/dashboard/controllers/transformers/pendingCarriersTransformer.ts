import type { PendingCarrier } from '../../types/pendingCarriersTypes';
import type { PaginationMeta } from '@/shared/responseEnvelope';

export interface PendingCarrierResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
  onboardingStatus: string;
  entryMethod: string | null;
  completedAt: string | null;
  inviteSentAt: string | null;
  driverCount: number;
  vehicleCount: number;
}

export const toPendingCarrierResponse = (carrier: PendingCarrier): PendingCarrierResponse => ({
  id: carrier.id,
  name: carrier.name,
  email: carrier.email,
  phone: carrier.phone,
  type: carrier.type,
  onboardingStatus: carrier.onboardingStatus,
  entryMethod: carrier.entryMethod,
  completedAt: carrier.completedAt?.toISOString() ?? null,
  inviteSentAt: carrier.inviteSentAt?.toISOString() ?? null,
  driverCount: carrier.driverCount,
  vehicleCount: carrier.vehicleCount,
});

export const toPendingCarrierListResponse = (
  carriers: PendingCarrier[],
  meta: PaginationMeta,
): { data: PendingCarrierResponse[]; meta: PaginationMeta } => ({
  data: carriers.map(toPendingCarrierResponse),
  meta,
});
