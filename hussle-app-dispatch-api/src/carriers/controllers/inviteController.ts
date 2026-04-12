import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { createCarrierInviteService } from '../services/carrierInviteService';

type CarrierInviteService = ReturnType<typeof createCarrierInviteService>;

interface InviteControllerDeps {
  carrierInviteService: CarrierInviteService;
}

export interface InviteControllers {
  sendInvite: RequestHandler;
  resendInvite: RequestHandler;
}

const sendInviteMapper = (req: Request) => ({
  carrierId: req.params['id'] ?? '',
  organizationId: req.organizationId ?? '',
  userId: req.user?.userId ?? '',
  message: req.body?.message as string | undefined,
});

const sendInviteTransformer = (result: { inviteSentAt: Date; tokenExpiresAt: Date }) => ({
  inviteSentAt: result.inviteSentAt.toISOString(),
  tokenExpiresAt: result.tokenExpiresAt.toISOString(),
});

export const createInviteControllers = (deps: InviteControllerDeps): InviteControllers => ({
  sendInvite: async (req: Request, res: Response): Promise<void> => {
    const input = sendInviteMapper(req);
    const result = await deps.carrierInviteService.sendInvite(input);
    sendSingle(res, sendInviteTransformer(result), 200);
  },
  resendInvite: async (req: Request, res: Response): Promise<void> => {
    const input = sendInviteMapper(req);
    const result = await deps.carrierInviteService.resendInvite(input);
    sendSingle(res, sendInviteTransformer(result), 200);
  },
});
