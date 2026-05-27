import type { Request, Response } from 'express';
import type { Invite } from '../../types/invite';
import type { Organization } from '../../types/organizationTypes';
import { sendSingle } from '@/shared/responseEnvelope';
import { NotFoundError } from '@/shared/errors';
import { InvitationStatus } from '@prisma/client';

interface VerifyInviteByTokenControllerDeps {
  inviteRepo: {
    findByToken: (token: string) => Promise<Invite | null>;
  };
  orgRepo: {
    findOrganizationById: (id: string) => Promise<Organization | null>;
  };
}

export const createVerifyInviteByTokenController =
  (deps: VerifyInviteByTokenControllerDeps) =>
  async (req: Request, res: Response) => {
    const token = req.params.token ?? '';

    const invite = await deps.inviteRepo.findByToken(token);

    if (!invite) {
      throw new NotFoundError('Invitation not found or already used');
    }

    if (invite.status !== InvitationStatus.PENDING) {
      throw new NotFoundError('Invitation is no longer valid');
    }

    if (new Date() > new Date(invite.expiresAt)) {
      res.status(400).json({ errors: [{ message: 'Invitation has expired' }] });
      return;
    }

    const organization = await deps.orgRepo.findOrganizationById(invite.organizationId);

    sendSingle(res, {
      email: invite.email,
      role: invite.role,
      firstName: invite.firstName ?? '',
      lastName: invite.lastName ?? '',
      organizationName: organization?.name ?? '',
      organizationId: invite.organizationId,
    });
  };
