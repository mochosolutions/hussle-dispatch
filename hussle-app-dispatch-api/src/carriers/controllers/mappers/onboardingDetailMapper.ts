import type { Request } from 'express';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { getRequiredCarrierIdMapper } from './getRequiredCarrierIdMapper';

export interface OnboardingDetailInput {
  carrierId: string;
  organizationId: string;
}

export const onboardingDetailMapper = (req: Request): OnboardingDetailInput => {
  const context = getRequestContextMapper(req);
  const carrierId = getRequiredCarrierIdMapper(req);
  return {
    carrierId,
    organizationId: context.organizationId,
  };
};
