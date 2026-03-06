import { BadRequestError } from '@mocho/common';
import { InvitationStatus } from '@prisma/client';
import { inviteUserService } from '../inviteUserService';

describe('inviteUserService', () => {
  const baseDeps = {
    findInviteByFilter: jest.fn().mockResolvedValue([]),
    findMembershipbyFilter: jest.fn().mockResolvedValue([]),
    createInvite: jest.fn().mockImplementation(async (payload) => payload),
    findUserByFilter: jest.fn().mockResolvedValue([]),
    findOneOrganizationByFilter: jest.fn().mockResolvedValue({ id: 'org-1', status: 'active' }),
    allowedRoles: ['admin', 'dispatcher', 'viewer', 'driver'],
  };

  it('creates invites for users not already invited or members', async () => {
    const deps = {
      ...baseDeps,
      createInvite: jest.fn().mockImplementation(async (payload) => ({ ...payload })),
    };

    const result = await inviteUserService(
      {
        users: [{ email: 'one@example.com', role: 'admin' }],
        organizationId: 'org-1',
        userOrganizationId: 'org-1',
      },
      deps,
    );

    expect(deps.createInvite).toHaveBeenCalledTimes(1);
    expect(deps.createInvite).toHaveBeenCalledWith(
      expect.objectContaining({ status: InvitationStatus.PENDING }),
    );
    expect(result.invited).toContain('one@example.com');
    expect(result.skipped).toHaveLength(0);
  });

  it('skips users with existing pending invite', async () => {
    const deps = {
      ...baseDeps,
      findInviteByFilter: jest.fn().mockResolvedValue([{ email: 'dup@example.com' }]),
    };

    const result = await inviteUserService(
      {
        users: [{ email: 'dup@example.com', role: 'admin' }],
        organizationId: 'org-1',
        userOrganizationId: 'org-1',
      },
      deps,
    );

    expect(deps.createInvite).not.toHaveBeenCalled();
    expect(result.invited).toHaveLength(0);
    expect(result.skipped[0]?.reason).toBe('Active invitation already exists');
  });

  it('throws when requester org does not match target org', async () => {
    await expect(
      inviteUserService(
        {
          users: [{ email: 'one@example.com', role: 'admin' }],
          organizationId: 'org-1',
          userOrganizationId: 'org-2',
        },
        baseDeps,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('skips user with role not in allowedRoles', async () => {
    const deps = {
      ...baseDeps,
      createInvite: jest.fn().mockImplementation(async (payload) => ({ ...payload })),
    };

    const result = await inviteUserService(
      {
        users: [{ email: 'hacker@example.com', role: 'hacker' }],
        organizationId: 'org-1',
        userOrganizationId: 'org-1',
      },
      deps,
    );

    expect(deps.createInvite).not.toHaveBeenCalled();
    expect(result.invited).toHaveLength(0);
    expect(result.skipped[0]?.reason).toBe('Invalid role: hacker');
  });
});
