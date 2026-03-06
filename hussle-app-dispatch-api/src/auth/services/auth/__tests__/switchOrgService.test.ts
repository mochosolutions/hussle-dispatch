import type { Membership } from '../../../types/membershipTypes';
import type { ITokenProvider } from '../../../types/tokenProvider';
import { switchOrgService } from '../switchOrgService';

describe('switchOrgService', () => {
  const memberships: Membership[] = [
    {
      membershipId: 'mem-1',
      userId: 'user-1',
      organizationId: 'org-1',
      orgName: 'Org One',
      orgSlug: 'org-one',
      orgSubscriptionTier: 'pro',
      orgStatus: 'active',
      role: 'owner',
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      membershipId: 'mem-2',
      userId: 'user-1',
      organizationId: 'org-2',
      orgName: 'Org Two',
      orgSlug: 'org-two',
      orgSubscriptionTier: 'starter',
      orgStatus: 'active',
      role: 'admin',
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const buildTokenProvider = (): ITokenProvider => ({
    createSession: jest
      .fn()
      .mockResolvedValue({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' }),
    refreshToken: jest.fn().mockResolvedValue(null),
    verifyAccessToken: jest.fn().mockResolvedValue(null),
    revokeSession: jest.fn().mockResolvedValue(undefined),
    revokeUserOrgSessions: jest.fn().mockResolvedValue(0),
    getSessionById: jest.fn().mockResolvedValue(null),
    getOrgSessions: jest.fn().mockResolvedValue([]),
    deleteOrgSessions: jest.fn().mockResolvedValue(undefined),
    verifyRefreshToken: jest.fn().mockResolvedValue(null),
  });

  it('throws when user does not exist', async () => {
    const tokenProvider = buildTokenProvider();
    const findUserByIdWithMemberships = jest.fn().mockResolvedValue(null);

    await expect(
      switchOrgService(
        {
          userId: 'user-1',
          sessionId: 'session-1',
          organizationId: 'org-2',
          refreshToken: 'old-refresh-token',
        },
        { tokenProvider, findUserByIdWithMemberships },
      ),
    ).rejects.toThrow('User not found');

    expect(tokenProvider.revokeSession).not.toHaveBeenCalled();
    expect(tokenProvider.createSession).not.toHaveBeenCalled();
  });

  it('throws when user has no active membership in target organization', async () => {
    const tokenProvider = buildTokenProvider();
    const findUserByIdWithMemberships = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      memberships: [{ ...memberships[0], status: 'inactive' }],
    });

    await expect(
      switchOrgService(
        {
          userId: 'user-1',
          sessionId: 'session-1',
          organizationId: 'org-2',
          refreshToken: 'old-refresh-token',
        },
        { tokenProvider, findUserByIdWithMemberships },
      ),
    ).rejects.toThrow('User does not have an active membership in the target organization');

    expect(tokenProvider.revokeSession).not.toHaveBeenCalled();
    expect(tokenProvider.createSession).not.toHaveBeenCalled();
  });

  it('revokes old session and creates new session for target organization', async () => {
    const tokenProvider = buildTokenProvider();
    const findUserByIdWithMemberships = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      memberships,
    });

    const result = await switchOrgService(
      {
        userId: 'user-1',
        sessionId: 'session-1',
        organizationId: 'org-2',
        refreshToken: 'old-refresh-token',
      },
      { tokenProvider, findUserByIdWithMemberships },
    );

    expect(tokenProvider.revokeSession).toHaveBeenCalledWith({
      sessionId: 'session-1',
      refreshToken: 'old-refresh-token',
    });
    expect(tokenProvider.createSession).toHaveBeenCalledWith({
      userId: 'user-1',
      organizationId: 'org-2',
      orgSlug: 'org-two',
      orgSubscriptionTier: 'starter',
      membershipId: 'mem-2',
      orgStatus: 'active',
      role: 'admin',
    });

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(result.user.organizationId).toBe('org-2');
    expect(result.orgs).toHaveLength(2);
  });
});
