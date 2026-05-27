import type { Request, Response } from 'express';
import type { Invite } from '../../types/invite';
import type { MembershipWithUser } from '../../types/membershipTypes';
import type { Organization } from '../../types/organizationTypes';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import { UnauthorizedError } from '@/shared/errors';
import { inviteUserService } from '../../services/invite/inviteUserService';
import { inviteUserMapper } from './mappers/inviteUserMapper';

interface InviteUserControllerDeps {
  inviteRepo: {
    create: (data: Record<string, unknown>) => Promise<Invite>;
    findInviteByFilter: (
      organizationId: string,
      filter: Record<string, unknown>,
    ) => Promise<Invite[] | null>;
    countPending: (organizationId: string) => Promise<number>;
  };
  membershipRepo: {
    findMembershipsByFilter: (
      organizationId: string,
      filter: Record<string, unknown>,
    ) => Promise<MembershipWithUser[] | null>;
    countActive: (organizationId: string) => Promise<number>;
  };
  userRepo: {
    findUsersByEmails: (emails: string[]) => Promise<{ id: string }[]>;
    findUserByIdWithMemberships: (id: string) => Promise<{ firstName: string; lastName: string } | null>;
  };
  orgRepo: {
    findOrganizationById: (id: string) => Promise<Organization | null>;
  };
  eventBus: EventBus;
  logger: Logger;
  allowedRoles: string[];
}

export const createInviteUserController =
  (deps: InviteUserControllerDeps) =>
  async (req: Request, res: Response) => {
    const input = inviteUserMapper(req);

    if (!input) {
      throw new UnauthorizedError('Unauthorized');
    }

    const result = await inviteUserService(input, {
      createInvite: (data) => deps.inviteRepo.create({
        ...data,
        invitedById: req.user?.userId ?? '',
      }),
      findInviteByFilter: (filter) => {
        const prismaFilter: Record<string, unknown> = {
          organizationId: input.organizationId,
          status: filter.status,
        };
        if (filter.email && typeof filter.email === 'object' && '$in' in filter.email) {
          prismaFilter.email = { in: (filter.email as { $in: string[] }).$in };
        }
        return deps.inviteRepo.findInviteByFilter(input.organizationId, prismaFilter);
      },
      findMembershipbyFilter: (filter) => {
        const prismaFilter: Record<string, unknown> = { organizationId: input.organizationId };
        if (filter.userId && typeof filter.userId === 'object' && '$in' in filter.userId) {
          const ids = (filter.userId as { $in: string[] }).$in;
          if (ids.length === 0) return Promise.resolve(null);
          prismaFilter.userId = { in: ids };
        }
        return deps.membershipRepo.findMembershipsByFilter(input.organizationId, prismaFilter);
      },
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
      countActiveMemberships: (organizationId) =>
        deps.membershipRepo.countActive(organizationId),
      countPendingInvitations: (organizationId) =>
        deps.inviteRepo.countPending(organizationId),
      allowedRoles: deps.allowedRoles,
    });

    // Publish invitation.created events fire-and-forget
    if (result.invites.length > 0) {
      const userId = req.user?.userId ?? '';
      const [inviterUser, org] = await Promise.all([
        deps.userRepo.findUserByIdWithMemberships(userId),
        deps.orgRepo.findOrganizationById(input.organizationId),
      ]);

      const inviterName = inviterUser
        ? `${inviterUser.firstName} ${inviterUser.lastName}`.trim()
        : 'A team member';
      const orgName = org?.name ?? 'your organization';

      for (const invite of result.invites) {
        deps.eventBus.publish('invitation.created', {
          inviteId: invite.id,
          organizationId: invite.organizationId,
          orgName,
          recipientEmail: invite.email,
          inviteeFirstName: invite.firstName ?? '',
          inviteeLastName: invite.lastName ?? '',
          inviterName,
          role: invite.role,
          inviteToken: invite.token,
          expiresAt: invite.expiresAt,
        }).catch((error: unknown) => {
          deps.logger.error('Failed to publish invitation.created', { error });
        });
      }
    }

    return res.status(200).json({
      message: 'User invited successfully',
      invite: result,
    });
  };
