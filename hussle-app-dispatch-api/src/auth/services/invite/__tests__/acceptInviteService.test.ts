import { BadRequestError } from '@mocho/common';
import { InvitationStatus } from '@prisma/client';
import { acceptInvitationService, type AcceptInvitationDeps } from '../acceptInviteService';

describe('acceptInvitationService', () => {
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

  const buildDeps = (overrides?: Partial<AcceptInvitationDeps>): AcceptInvitationDeps => ({
    findOneByFilter: jest.fn().mockResolvedValue(baseInvite),
    updateInvite: jest.fn().mockImplementation(async (_id, data) => ({ ...baseInvite, ...data })),
    ...overrides,
  });

  it('accepts a pending invite and marks it ACCEPTED', async () => {
    const deps = buildDeps();

    const result = await acceptInvitationService({ invitationToken: 'token-1' }, deps);

    expect(deps.findOneByFilter).toHaveBeenCalledWith({ token: 'token-1' });
    expect(deps.updateInvite).toHaveBeenCalledWith(
      'invite-1',
      { status: InvitationStatus.ACCEPTED },
    );
    expect(result.invite.status).toBe(InvitationStatus.ACCEPTED);
    expect(result.invite.email).toBe('user@example.com');
  });

  it('marks expired invite as EXPIRED and throws', async () => {
    const deps = buildDeps({
      findOneByFilter: jest.fn().mockResolvedValue({
        ...baseInvite,
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      }),
    });

    await expect(
      acceptInvitationService({ invitationToken: 'token-1' }, deps),
    ).rejects.toBeInstanceOf(BadRequestError);

    expect(deps.updateInvite).toHaveBeenCalledWith(
      'invite-1',
      { status: InvitationStatus.EXPIRED },
    );
  });

  it('throws when invite is not pending', async () => {
    const deps = buildDeps({
      findOneByFilter: jest.fn().mockResolvedValue({
        ...baseInvite,
        status: InvitationStatus.ACCEPTED,
      }),
    });

    await expect(
      acceptInvitationService({ invitationToken: 'token-1' }, deps),
    ).rejects.toBeInstanceOf(BadRequestError);

    expect(deps.updateInvite).not.toHaveBeenCalled();
  });

  it('throws when invite is not found', async () => {
    const deps = buildDeps({
      findOneByFilter: jest.fn().mockResolvedValue(null),
    });

    await expect(
      acceptInvitationService({ invitationToken: 'unknown' }, deps),
    ).rejects.toBeInstanceOf(BadRequestError);

    expect(deps.updateInvite).not.toHaveBeenCalled();
  });
});
