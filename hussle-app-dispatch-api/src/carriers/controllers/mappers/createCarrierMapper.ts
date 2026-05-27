import type { Request } from 'express';
import type { CreateCarrierInput } from '../../types/carrierTypes';
import type { CreateCarrierServiceInput } from '../../types/carrierServiceTypes';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';

export const createCarrierMapper = (req: Request): CreateCarrierServiceInput => {
  const context = getRequestContextMapper(req);
  const input: CreateCarrierInput = req.body;

  return {
    ...context,
    userId: req.user?.userId ?? null,
    input,
  };
};
