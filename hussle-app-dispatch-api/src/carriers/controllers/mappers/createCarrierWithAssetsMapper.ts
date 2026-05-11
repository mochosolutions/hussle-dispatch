import type { Request } from 'express';
import type { CreateCarrierWithAssetsInput } from '../../types/carrierTypes';
import type { CreateCarrierWithAssetsServiceInput } from '../../types/carrierServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const createCarrierWithAssetsMapper = (
  req: Request,
): CreateCarrierWithAssetsServiceInput => {
  const context = getRequestContextMapper(req);
  const input: CreateCarrierWithAssetsInput = req.body;

  return {
    ...context,
    userId: req.user?.userId ?? null,
    input,
  };
};
