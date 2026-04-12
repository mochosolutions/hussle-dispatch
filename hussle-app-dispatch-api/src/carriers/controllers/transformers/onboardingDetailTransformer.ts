import type { OnboardingDetail } from '../../types/onboardingDetailTypes';

export interface CarrierOnboardingDetailResponse {
  carrier: Record<string, unknown>;
  session: Record<string, unknown> | null;
  vehicles: Record<string, unknown>[];
  drivers: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  lanePreferences?: Record<string, unknown>;
}

export const toOnboardingDetailResponse = (
  detail: OnboardingDetail,
): CarrierOnboardingDetailResponse => ({
  carrier: detail.carrier,
  session: detail.session,
  vehicles: detail.vehicles,
  drivers: detail.drivers,
  documents: detail.documents,
  ...(detail.lanePreferences !== undefined && {
    lanePreferences: detail.lanePreferences,
  }),
});
