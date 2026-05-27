import { NotFoundError } from '@/shared/errors';
import type { OnboardingDetailPort, OnboardingDetail } from '../types/onboardingDetailTypes';

interface CarrierOnboardingDetailServiceDeps {
  onboardingDetailPort: OnboardingDetailPort;
}

export interface CarrierOnboardingDetailService {
  getOnboardingDetail(carrierId: string, organizationId: string): Promise<OnboardingDetail>;
}

export const createCarrierOnboardingDetailService = (
  deps: CarrierOnboardingDetailServiceDeps,
): CarrierOnboardingDetailService => ({
  getOnboardingDetail: async (carrierId, organizationId) => {
    const detail = await deps.onboardingDetailPort.getOnboardingDetail(carrierId, organizationId);

    if (!detail) {
      throw new NotFoundError(`Carrier with id ${carrierId} not found`);
    }

    return detail;
  },
});
