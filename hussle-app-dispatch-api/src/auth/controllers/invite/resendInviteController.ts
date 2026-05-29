import type { Request, Response } from 'express';
import type { Invite } from '../../types/invite';
import type { Organization } from '../../types/organizationTypes';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import { UnauthorizedError } from '@/shared/errors';
import { resendInviteService } from '../../services/invite/resendInviteService';
import { inviteActionMapper } from './mappers/inviteActionMapper';

interface ResendInviteControllerDeps {
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
  userRepo: {
    findUserByIdWithMemberships: (
      id: string,
    ) => Promise<{ firstName: string; lastName: string } | null>;
  };
  orgRepo: {
    findOrganizationById: (id: string) => Promise<Organization | null>;
  };
  eventBus: EventBus;
  logger: Logger;
}

export const createResendInviteController =
  (deps: ResendInviteControllerDeps) =>
  async (req: Request, res: Response) => {
    const input = inviteActionMapper(req);

    if (!input) {
      throw new UnauthorizedError('Unauthorized');
    }

    const { invite } = await resendInviteService(input, {
      findOneByFilter: deps.inviteRepo.findOneByFilter,
      updateInvite: deps.inviteRepo.updateInvite,
    });

    const userId = req.user?.userId ?? '';
    const [inviterUser, org] = await Promise.all([
      deps.userRepo.findUserByIdWithMemberships(userId),
      deps.orgRepo.findOrganizationById(input.organizationId),
    ]);

    const inviterName = inviterUser
      ? `${inviterUser.firstName} ${inviterUser.lastName}`.trim()
      : 'A team member';
    const orgName = org?.name ?? 'your organization';

    deps.eventBus
      .publish('invitation.created', {
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
      })
      .catch((error: unknown) => {
        deps.logger.error('Failed to publish invitation.created', { error });
      });

    deps.logger.info('Invitation resent', { inviteId: invite.id });

    return res.status(200).json({ message: 'Invitation resent', invite });
  };
