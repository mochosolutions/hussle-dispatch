import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { CarrierOnboardingDetailService } from '../services/carrierOnboardingDetailService';
import { onboardingDetailMapper } from './mappers/onboardingDetailMapper';
import { toOnboardingDetailResponse } from './transformers/onboardingDetailTransformer';

interface OnboardingDetailControllerDeps {
  carrierOnboardingDetailService: CarrierOnboardingDetailService;
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
    sendSingle(res, toOnboardingDetailResponse(detail));
  },
});
