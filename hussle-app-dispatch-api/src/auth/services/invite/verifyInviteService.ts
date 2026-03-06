import { InvitationStatus } from '@prisma/client';
import { ValidationError } from '@/shared/errors';
import type { Invite } from '../../types/invite';
import type { Organization } from '../../types/organizationTypes';
import type { User } from '../../types/user';

export interface VerifyInviteInput {
  invitationToken: string;
  organizationId: string;
}

interface VerifyInviteDeps {
  inviteRepo: Pick<
    {
      findOneByFilter: (filter: Record<string, unknown>) => Promise<Invite | null>;
      updateInvite: (id: string, data: Partial<Invite>) => Promise<Invite | null>;
    },
    'findOneByFilter' | 'updateInvite'
  >;
  orgRepo: Pick<
    {
      findOrganizationById: (id: string) => Promise<Organization | null>;
    },
    'findOrganizationById'
  >;
  userRepo: Pick<
    {
      findUserByEmail: (email: string) => Promise<User | null>;
    },
    'findUserByEmail'
  >;
}

export interface VerifyInviteResult {
  invite: {
    email: string;
    role: string;
    organizationId: string;
    expiresAt: string;
  };
  userExists: boolean;
}

export const verifyInviteService = async (
  { invitationToken }: VerifyInviteInput,
  deps: VerifyInviteDeps,
): Promise<VerifyInviteResult> => {
  const existingInvitation = await deps.inviteRepo.findOneByFilter({ token: invitationToken });

  if (!existingInvitation) {
    throw new ValidationError('Invalid or expired invite');
  }

  if (existingInvitation.status !== InvitationStatus.PENDING) {
    throw new ValidationError('Invitation is no longer valid');
  }

  if (new Date() > new Date(existingInvitation.expiresAt)) {
    await deps.inviteRepo.updateInvite(existingInvitation.id, { status: InvitationStatus.EXPIRED });
    throw new ValidationError('Invite link has expired');
  }

  const organization = await deps.orgRepo.findOrganizationById(existingInvitation.organizationId);

  if (!organization) {
    throw new ValidationError('Organization no longer exists');
  }

  const userExists = await deps.userRepo.findUserByEmail(existingInvitation.email);

  return {
    invite: {
      email: existingInvitation.email,
      role: existingInvitation.role,
      organizationId: existingInvitation.organizationId,
      expiresAt: existingInvitation.expiresAt,
    },
    userExists: Boolean(userExists),
  };
};
