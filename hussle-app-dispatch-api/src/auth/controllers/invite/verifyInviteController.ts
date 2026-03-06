import type { Request, Response } from 'express';
import type { Invite } from '../../types/invite';
import type { Organization } from '../../types/organizationTypes';
import type { User } from '../../types/user';
import { verifyInviteService } from '../../services/invite/verifyInviteService';
import { verifyInviteMapper } from './mappers/verifyInviteMapper';

interface VerifyInviteControllerDeps {
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
  orgRepo: {
    findOrganizationById: (id: string) => Promise<Organization | null>;
  };
  userRepo: {
    findUserByEmail: (email: string) => Promise<User | null>;
  };
}

export const createVerifyInviteController =
  (deps: VerifyInviteControllerDeps) =>
  async (req: Request, res: Response) => {
    const input = verifyInviteMapper(req);

    const result = await verifyInviteService(input, {
      inviteRepo: {
        findOneByFilter: (filter) =>
          deps.inviteRepo.findOneByFilter(input.organizationId, filter),
        updateInvite: (id, data) =>
          deps.inviteRepo.updateInvite(input.organizationId, id, data),
      },
      orgRepo: deps.orgRepo,
      userRepo: deps.userRepo,
    });

    return res.status(200).json({
      message: 'Invite verified successfully',
      invite: result.invite,
      userExists: result.userExists,
    });
  };
