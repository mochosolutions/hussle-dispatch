import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { createCarrierApprovalService } from '../services/carrierApprovalService';
import {
  adminActivateCarrierMapper,
  approveCarrierMapper,
  rejectCarrierMapper,
} from './mappers/approvalMapper';
import {
  toAdminActivateResponse,
  toApproveCarrierResponse,
  toRejectCarrierResponse,
} from './transformers/approvalTransformer';

type CarrierApprovalService = ReturnType<typeof createCarrierApprovalService>;

interface ApprovalControllerDeps {
  carrierApprovalService: CarrierApprovalService;
  eventBus: EventBus;
}

export interface ApprovalControllers {
  approve: RequestHandler;
  reject: RequestHandler;
  adminActivate: RequestHandler;
}

export const createApprovalControllers = (deps: ApprovalControllerDeps): ApprovalControllers => ({
  approve: async (req: Request, res: Response): Promise<void> => {
    const input = approveCarrierMapper(req);
    const result = await deps.carrierApprovalService.approve(input);
    deps.eventBus.publish(result.event.name, result.event.payload).catch(() => undefined);
    sendSingle(res, toApproveCarrierResponse(result.data));
  },

  reject: async (req: Request, res: Response): Promise<void> => {
    const input = rejectCarrierMapper(req);
    const result = await deps.carrierApprovalService.reject(input);
    deps.eventBus.publish(result.event.name, result.event.payload).catch(() => undefined);
    sendSingle(res, toRejectCarrierResponse(result.data));
  },

  adminActivate: async (req: Request, res: Response): Promise<void> => {
    const input = adminActivateCarrierMapper(req);
    const result = await deps.carrierApprovalService.adminActivate(input);
    sendSingle(res, toAdminActivateResponse(result.data));
  },
});
