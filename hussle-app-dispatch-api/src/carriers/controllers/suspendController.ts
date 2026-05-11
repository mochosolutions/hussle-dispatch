import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { createCarrierSuspendService } from '../services/carrierSuspendService';
import { suspendCarrierMapper, unsuspendCarrierMapper } from './mappers/approvalMapper';

type CarrierSuspendService = ReturnType<typeof createCarrierSuspendService>;

interface SuspendControllerDeps {
  carrierSuspendService: CarrierSuspendService;
}

export interface SuspendControllers {
  suspend: RequestHandler;
  unsuspend: RequestHandler;
}

export const createSuspendControllers = (deps: SuspendControllerDeps): SuspendControllers => ({
  suspend: async (req: Request, res: Response): Promise<void> => {
    const input = suspendCarrierMapper(req);
    const result = await deps.carrierSuspendService.suspend(input);
    sendSingle(res, result.data);
  },

  unsuspend: async (req: Request, res: Response): Promise<void> => {
    const input = unsuspendCarrierMapper(req);
    const result = await deps.carrierSuspendService.unsuspend(input);
    sendSingle(res, result.data);
  },
});
