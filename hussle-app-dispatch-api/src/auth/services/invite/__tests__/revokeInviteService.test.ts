import { BadRequestError } from '@mocho/common';
import { InvitationStatus } from '@prisma/client';
import { revokeInviteService, type RevokeInviteDeps } from '../revokeInviteService';

describe('revokeInviteService', () => {
  const baseInvite = {
    id: 'invite-1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'dispatcher',
    organizationId: 'org-1',
    status: InvitationStatus.PENDING,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };

  const buildDeps = (overrides?: Partial<RevokeInviteDeps>): RevokeInviteDeps => ({
    findOneByFilter: jest.fn().mockResolvedValue(baseInvite),
    updateInvite: jest.fn().mockImplementation(async (_org, _id, data) => ({ ...baseInvite, ...data })),
    ...overrides,
  });

  const input = { organizationId: 'org-1', inviteId: 'invite-1' };

  it('revokes a pending invite (status REVOKED), scoped to the org', async () => {
    const deps = buildDeps();

    const result = await revokeInviteService(input, deps);

    expect(deps.findOneByFilter).toHaveBeenCalledWith('org-1', { id: 'invite-1' });
    expect(deps.updateInvite).toHaveBeenCalledWith('org-1', 'invite-1', {
      status: InvitationStatus.REVOKED,
    });
    expect(result.invite.status).toBe(InvitationStatus.REVOKED);
  });

  it('is idempotent when already revoked', async () => {
    const deps = buildDeps({
      findOneByFilter: jest.fn().mockResolvedValue({
        ...baseInvite,
        status: InvitationStatus.REVOKED,
      }),
    });

    const result = await revokeInviteService(input, deps);

    expect(result.invite.status).toBe(InvitationStatus.REVOKED);
    expect(deps.updateInvite).not.toHaveBeenCalled();
  });

  it('throws when the invite was already accepted', async () => {
    const deps = buildDeps({
      findOneByFilter: jest.fn().mockResolvedValue({
        ...baseInvite,
        status: InvitationStatus.ACCEPTED,
      }),
    });

    await expect(revokeInviteService(input, deps)).rejects.toBeInstanceOf(BadRequestError);
    expect(deps.updateInvite).not.toHaveBeenCalled();
  });

  it('throws when the invite is not found in the org', async () => {
    const deps = buildDeps({ findOneByFilter: jest.fn().mockResolvedValue(null) });

    await expect(revokeInviteService(input, deps)).rejects.toBeInstanceOf(BadRequestError);
    expect(deps.updateInvite).not.toHaveBeenCalled();
  });
});
