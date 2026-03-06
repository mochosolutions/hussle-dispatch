import type { Request, Response } from 'express';
import type { Invite } from '../../types/invite';
import type { MembershipWithUser } from '../../types/membershipTypes';
import type { Organization } from '../../types/organizationTypes';
import { UnauthorizedError } from '@/shared/errors';
import { inviteUserService } from '../../services/invite/inviteUserService';
import { inviteUserMapper } from './mappers/inviteUserMapper';

interface InviteUserControllerDeps {
  inviteRepo: {
    create: (data: {
      email: string;
      role: string;
      organizationId: string;
      token: string;
      status: string;
      expiresAt: Date;
    }) => Promise<{ email: string }>;
    findInviteByFilter: (
      organizationId: string,
      filter: Record<string, unknown>,
    ) => Promise<Invite[] | null>;
  };
  membershipRepo: {
    findMembershipsByFilter: (
      organizationId: string,
      filter: Record<string, unknown>,
    ) => Promise<MembershipWithUser[] | null>;
  };
  userRepo: {
    findUsersByEmails: (emails: string[]) => Promise<{ id: string }[]>;
  };
  orgRepo: {
    findOrganizationById: (id: string) => Promise<Organization | null>;
  };
  allowedRoles: string[];
}

export const createInviteUserController =
  (deps: InviteUserControllerDeps) =>
  async (req: Request, res: Response) => {
    const input = inviteUserMapper(req);

    if (!input) {
      throw new UnauthorizedError('Unauthorized');
    }

    const invite = await inviteUserService(input, {
      createInvite: (data) => deps.inviteRepo.create(data),
      findInviteByFilter: (filter) =>
        deps.inviteRepo.findInviteByFilter(input.organizationId, filter),
      findMembershipbyFilter: (filter) =>
        deps.membershipRepo.findMembershipsByFilter(input.organizationId, filter),
      findUserByFilter: async (filter) => {
        const found = await deps.userRepo.findUsersByEmails(filter.email.$in);
        return found.length > 0 ? found : null;
      },
      findOneOrganizationByFilter: async (filter) => {
        const org = await deps.orgRepo.findOrganizationById(filter.id);
        if (!org || org.status !== filter.status) {
          return null;
        }
        return { id: org.id };
      },
      allowedRoles: deps.allowedRoles,
    });

    return res.status(200).json({
      message: 'User invited successfully',
      invite,
    });
  };
