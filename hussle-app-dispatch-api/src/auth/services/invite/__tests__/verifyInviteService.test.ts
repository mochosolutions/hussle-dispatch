import { InvitationStatus } from '@prisma/client';
import { ValidationError } from '@/shared/errors';
import { verifyInviteService } from '../verifyInviteService';

describe('verifyInviteService', () => {
  const baseInvite = {
    id: 'invite-1',
    organizationId: 'org-1',
    email: 'user@example.com',
    role: 'admin',
    token: 'token-1',
    status: InvitationStatus.PENDING,
    invitedBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };

  const buildDeps = (overrides?: {
    invite?: Partial<{
      findOneByFilter: jest.Mock;
      updateInvite: jest.Mock;
    }>;
    org?: Partial<{
      findOrganizationById: jest.Mock;
    }>;
    user?: Partial<{
      findUserByEmail: jest.Mock;
    }>;
  }) => ({
    inviteRepo: {
      findOneByFilter: jest.fn().mockResolvedValue(baseInvite),
      updateInvite: jest.fn().mockResolvedValue(baseInvite),
      ...overrides?.invite,
    },
    orgRepo: {
      findOrganizationById: jest.fn().mockResolvedValue({ id: 'org-1' }),
      ...overrides?.org,
    },
    userRepo: {
      findUserByEmail: jest.fn().mockResolvedValue(null),
      ...overrides?.user,
    },
  });

  it('returns invite and userExists false for valid pending invite with no user', async () => {
    const deps = buildDeps();

    const result = await verifyInviteService(
      {
        invitationToken: 'token-1',
        organizationId: 'org-1',
      },
      deps,
    );

    expect(result.invite.email).toBe('user@example.com');
    expect(result.userExists).toBe(false);
  });

  it('throws when invite is not found', async () => {
    const deps = buildDeps({
      invite: {
        findOneByFilter: jest.fn().mockResolvedValue(null),
      },
    });

    await expect(
      verifyInviteService(
        {
          invitationToken: 'token-1',
          organizationId: 'org-1',
        },
        deps,
      ),
    ).rejects.toThrow(new ValidationError('Invalid or expired invite'));
  });

  it('throws when invite status is not pending', async () => {
    const deps = buildDeps({
      invite: {
        findOneByFilter: jest.fn().mockResolvedValue({
          ...baseInvite,
          status: InvitationStatus.ACCEPTED,
        }),
      },
    });

    await expect(
      verifyInviteService(
        {
          invitationToken: 'token-1',
          organizationId: 'org-1',
        },
        deps,
      ),
    ).rejects.toThrow(new ValidationError('Invitation is no longer valid'));
  });

  it('expires invite and throws when expired', async () => {
    const deps = buildDeps({
      invite: {
        findOneByFilter: jest.fn().mockResolvedValue({
          ...baseInvite,
          expiresAt: new Date(Date.now() - 60_000).toISOString(),
        }),
      },
    });

    await expect(
      verifyInviteService(
        {
          invitationToken: 'token-1',
          organizationId: 'org-1',
        },
        deps,
      ),
    ).rejects.toThrow(new ValidationError('Invite link has expired'));

    expect(deps.inviteRepo.updateInvite).toHaveBeenCalledWith('invite-1', {
      status: InvitationStatus.EXPIRED,
    });
  });

  it('throws when organization no longer exists', async () => {
    const deps = buildDeps({
      org: {
        findOrganizationById: jest.fn().mockResolvedValue(null),
      },
    });

    await expect(
      verifyInviteService(
        {
          invitationToken: 'token-1',
          organizationId: 'org-1',
        },
        deps,
      ),
    ).rejects.toThrow(new ValidationError('Organization no longer exists'));
  });

  it('returns userExists true when user exists', async () => {
    const deps = buildDeps({
      user: {
        findUserByEmail: jest.fn().mockResolvedValue({ id: 'user-1' }),
      },
    });

    const result = await verifyInviteService(
      {
        invitationToken: 'token-1',
        organizationId: 'org-1',
      },
      deps,
    );

    expect(result.userExists).toBe(true);
  });
});
