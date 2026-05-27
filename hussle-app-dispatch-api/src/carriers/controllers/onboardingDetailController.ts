import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { CarrierOnboardingDetailService } from '../services/carrierOnboardingDetailService';
import type { DerivedComplianceDeps } from '../services/derivedCompliance';
import { computeCompliancesForCarriers } from '../services/derivedComplianceBatch';
import { onboardingDetailMapper } from './mappers/onboardingDetailMapper';
import { toOnboardingDetailResponse } from './transformers/onboardingDetailTransformer';

interface OnboardingDetailControllerDeps {
  carrierOnboardingDetailService: CarrierOnboardingDetailService;
  // Source the compliance projection from the compute functions instead of
  // the cached Carrier columns. Wired by the module composition root.
  derivedComplianceDeps: DerivedComplianceDeps;
}

export interface OnboardingDetailControllers {
  getOnboardingDetail: RequestHandler;
}

export const createOnboardingDetailControllers = (
  deps: OnboardingDetailControllerDeps,
): OnboardingDetailControllers => ({
  getOnboardingDetail: async (req: Request, res: Response): Promise<void> => {
    const input = onboardingDetailMapper(req);
    const detail = await deps.carrierOnboardingDetailService.getOnboardingDetail(
      input.carrierId,
      input.organizationId,
    );
    const complianceById = await computeCompliancesForCarriers(
      [input.carrierId],
      deps.derivedComplianceDeps,
    );
    sendSingle(res, toOnboardingDetailResponse(detail, complianceById.get(input.carrierId)));
  },
});
