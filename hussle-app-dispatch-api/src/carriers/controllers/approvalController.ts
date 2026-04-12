import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { createCarrierApprovalService } from '../services/carrierApprovalService';
import { approveCarrierMapper, rejectCarrierMapper } from './mappers/approvalMapper';
import { toApproveCarrierResponse, toRejectCarrierResponse } from './transformers/approvalTransformer';

type CarrierApprovalService = ReturnType<typeof createCarrierApprovalService>;

interface ApprovalControllerDeps {
  carrierApprovalService: CarrierApprovalService;
  eventBus: EventBus;
}

export interface ApprovalControllers {
  approve: RequestHandler;
  reject: RequestHandler;
}

export const createApprovalControllers = (deps: ApprovalControllerDeps): ApprovalControllers => ({
  approve: async (req: Request, res: Response): Promise<void> => {
    const input = approveCarrierMapper(req);
    const result = await deps.carrierApprovalService.approve(input);
    deps.eventBus.publish(result.event.name, result.event.payload).catch(() => {});
    sendSingle(res, toApproveCarrierResponse(result.data));
  },

  reject: async (req: Request, res: Response): Promise<void> => {
    const input = rejectCarrierMapper(req);
    const result = await deps.carrierApprovalService.reject(input);
    deps.eventBus.publish(result.event.name, result.event.payload).catch(() => {});
    sendSingle(res, toRejectCarrierResponse(result.data));
  },
});
