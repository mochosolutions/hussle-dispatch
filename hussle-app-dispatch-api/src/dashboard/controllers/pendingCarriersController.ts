import type { Request, Response, RequestHandler } from 'express';
import { sendList } from '@/shared/responseEnvelope';
import type { PendingCarriersService } from '../services/pendingCarriersService';
import { pendingCarriersMapper } from './mappers/pendingCarriersMapper';
import { toPendingCarrierListResponse } from './transformers/pendingCarriersTransformer';

interface PendingCarriersControllerDeps {
  pendingCarriersService: PendingCarriersService;
}

export interface PendingCarriersControllers {
  getPendingCarriers: RequestHandler;
}

export const createPendingCarriersControllers = (
  deps: PendingCarriersControllerDeps,
): PendingCarriersControllers => ({
  getPendingCarriers: async (req: Request, res: Response): Promise<void> => {
    const input = pendingCarriersMapper(req);
    const result = await deps.pendingCarriersService.listPendingCarriers(
      input.organizationId,
      input.page,
      input.limit,
    );
    const response = toPendingCarrierListResponse(result.data, result.meta);
    sendList(res, { data: response.data, meta: response.meta });
  },
});
