import type { Request, RequestHandler, Response } from 'express';

import { sendSingle } from '@/shared/responseEnvelope';

import type { InviteDriverInput, InviteDriverResult } from '../services/inviteDriverService';

interface InviteDriverControllerDeps {
  inviteDriver: (input: InviteDriverInput) => Promise<InviteDriverResult>;
}

const inviteDriverMapper = (req: Request): InviteDriverInput => ({
  driverId: req.params['driverId'] ?? '',
  organizationId: req.user?.organizationId ?? '',
  invitedByUserId: req.user?.userId ?? '',
});

export const createInviteDriverController = (deps: InviteDriverControllerDeps): RequestHandler =>
  async (req: Request, res: Response): Promise<void> => {
    const input = inviteDriverMapper(req);
    const result = await deps.inviteDriver(input);

    sendSingle(
      res,
      {
        driverId: result.driverId,
        setupUrl: result.setupUrl,
        expiresAt: result.expiresAt.toISOString(),
        sentTo: result.sentTo,
      },
      201,
    );
  };
