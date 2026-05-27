import type { Request } from 'express';
import type { UpdateCarrierInput } from '../../types/carrierTypes';
import type { UpdateCarrierServiceInput } from '../../types/carrierServiceTypes';
import { getRequiredCarrierIdMapper } from './getRequiredCarrierIdMapper';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const updateCarrierMapper = (req: Request): UpdateCarrierServiceInput => {
  const context = getRequestContextMapper(req);
  const id = getRequiredCarrierIdMapper(req);
  const input: UpdateCarrierInput = req.body;

  return {
    ...context,
    id,
    input,
  };
};
