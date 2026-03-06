import type { Request, Response } from 'express';
import type { Invite } from '../../types/invite';
import { getInvitesMapper } from './mappers/getInvitesMapper';
import { toInviteListResponse } from './transformers/inviteTransformer';

interface GetInvitesControllerDeps {
  inviteRepo: {
    findAllInvites: (organizationId: string) => Promise<Invite[]>;
  };
}

export const createGetInvitesController =
  (deps: GetInvitesControllerDeps) =>
  async (req: Request, res: Response) => {
    const { organizationId } = getInvitesMapper(req);

    const invites = await deps.inviteRepo.findAllInvites(organizationId);

    return res.status(200).json({
      message: 'Invite verified successfully',
      invites: toInviteListResponse(invites),
    });
  };
