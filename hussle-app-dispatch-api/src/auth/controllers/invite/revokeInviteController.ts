import type { Request, Response } from 'express';
import type { Invite } from '../../types/invite';
import type { Logger } from '@/shared/utils/logger';
import { UnauthorizedError } from '@/shared/errors';
import { revokeInviteService } from '../../services/invite/revokeInviteService';
import { inviteActionMapper } from './mappers/inviteActionMapper';

interface RevokeInviteControllerDeps {
  inviteRepo: {
    findOneByFilter: (
      organizationId: string,
      filter: Record<string, unknown>,
    ) => Promise<Invite | null>;
    updateInvite: (
      organizationId: string,
      id: string,
      data: Partial<Invite>,
    ) => Promise<Invite | null>;
  };
  logger: Logger;
}

export const createRevokeInviteController =
  (deps: RevokeInviteControllerDeps) =>
  async (req: Request, res: Response) => {
    const input = inviteActionMapper(req);

    if (!input) {
      throw new UnauthorizedError('Unauthorized');
    }

    const result = await revokeInviteService(input, {
      findOneByFilter: deps.inviteRepo.findOneByFilter,
      updateInvite: deps.inviteRepo.updateInvite,
    });

    deps.logger.info('Invitation revoked', { inviteId: input.inviteId });

    return res.status(200).json({ message: 'Invitation revoked', invite: result.invite });
  };
