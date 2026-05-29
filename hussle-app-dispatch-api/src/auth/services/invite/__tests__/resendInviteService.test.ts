import { BadRequestError } from '@mocho/common';
import { InvitationStatus } from '@prisma/client';
import { resendInviteService, type ResendInviteDeps } from '../resendInviteService';

describe('resendInviteService', () => {
  const baseInvite = {
    id: 'invite-1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'dispatcher',
    organizationId: 'org-1',
    token: 'old-token',
    status: InvitationStatus.PENDING,
    expiresAt: new Date(Date.now() - 60_000).toISOString(),
  };

  const buildDeps = (overrides?: Partial<ResendInviteDeps>): ResendInviteDeps => ({
    findOneByFilter: jest.fn().mockResolvedValue(baseInvite),
    updateInvite: jest.fn().mockImplementation(async (_org, _id, data) => ({ ...baseInvite, ...data })),
    ...overrides,
  });

  const input = { organizationId: 'org-1', inviteId: 'invite-1' };

  it('re-issues a fresh token, future expiry, and PENDING status', async () => {
    const deps = buildDeps();

    const result = await resendInviteService(input, deps);

    expect(deps.findOneByFilter).toHaveBeenCalledWith('org-1', { id: 'invite-1' });
    const [, , data] = (deps.updateInvite as jest.Mock).mock.calls[0];
    expect(data.status).toBe(InvitationStatus.PENDING);
    expect(data.token).not.toBe('old-token');
    expect(new Date(data.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(result.invite.status).toBe(InvitationStatus.PENDING);
  });

  it('resends an expired invite', async () => {
    const deps = buildDeps({
      findOneByFilter: jest.fn().mockResolvedValue({
        ...baseInvite,
        status: InvitationStatus.EXPIRED,
      }),
    });

    const result = await resendInviteService(input, deps);

    expect(result.invite.status).toBe(InvitationStatus.PENDING);
    expect(deps.updateInvite).toHaveBeenCalled();
  });

  it('throws when the invite was already accepted', async () => {
    const deps = buildDeps({
      findOneByFilter: jest.fn().mockResolvedValue({
        ...baseInvite,
        status: InvitationStatus.ACCEPTED,
      }),
    });

    await expect(resendInviteService(input, deps)).rejects.toBeInstanceOf(BadRequestError);
    expect(deps.updateInvite).not.toHaveBeenCalled();
  });

  it('throws when the invite was revoked', async () => {
    const deps = buildDeps({
      findOneByFilter: jest.fn().mockResolvedValue({
        ...baseInvite,
        status: InvitationStatus.REVOKED,
      }),
    });

    await expect(resendInviteService(input, deps)).rejects.toBeInstanceOf(BadRequestError);
    expect(deps.updateInvite).not.toHaveBeenCalled();
  });

  it('throws when the invite is not found in the org', async () => {
    const deps = buildDeps({ findOneByFilter: jest.fn().mockResolvedValue(null) });

    await expect(resendInviteService(input, deps)).rejects.toBeInstanceOf(BadRequestError);
    expect(deps.updateInvite).not.toHaveBeenCalled();
  });
});
