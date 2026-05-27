import { BadRequestError } from '@mocho/common';
import type { IAuthProvider } from '../../../types/authProviderTypes';
import type { ITokenProvider } from '../../../types/tokenProvider';
import { deleteOrganizationUseCase } from '../deleteOrgService';

const buildTokenProvider = (): ITokenProvider => ({
  createSession: jest.fn(),
  refreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  revokeSession: jest.fn(),
  revokeUserOrgSessions: jest.fn(),
  getSessionById: jest.fn(),
  getOrgSessions: jest.fn(),
  deleteOrgSessions: jest.fn(),
  verifyRefreshToken: jest.fn(),
});

const buildAuthProvider = (): IAuthProvider => ({
  createUser: jest.fn(),
  signUpUser: jest.fn(),
  authenticateUser: jest.fn(),
  deleteUser: jest.fn(),
  passwordChallenge: jest.fn(),
  confirmUser: jest.fn(),
  resendConfirmationCode: jest.fn(),
  logout: jest.fn(),
  forgotPassword: jest.fn(),
  confirmForgotPassword: jest.fn(),
  refreshToken: jest.fn(),
  deleteUserMany: jest.fn(),
});

describe('deleteOrganizationUseCase', () => {
  it('throws BadRequestError when organizationId is missing', async () => {
    const tokenProvider = buildTokenProvider();
    const authProvider = buildAuthProvider();

    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      tokenProvider,
      authProvider,
      getMembershipService: jest.fn().mockResolvedValue([]),
      deleteOrgService: jest.fn().mockResolvedValue(null),
      updateManyUsersService: jest.fn().mockResolvedValue([]),
      deleteManyMembershipService: jest.fn().mockResolvedValue([]),
      deleteInvitationsByFilter: jest.fn().mockResolvedValue(0),
      getUserActiveMembershipsCount: jest.fn().mockResolvedValue(0),
    };

    await expect(
      deleteOrganizationUseCase(
        {
          organizationId: '',
        },
        deps,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('deletes memberships/invitations/sessions and cleans orphaned cognito users', async () => {
    const tokenProvider = buildTokenProvider();
    const authProvider = buildAuthProvider();

    tokenProvider.getOrgSessions = jest.fn().mockResolvedValue([
      {
        sessionKey: 'session:1',
        refreshToken: 'refresh-1',
        sessionData: {
          sessionId: 'session-1',
          userId: 'user-1',
          organizationId: 'org-1',
          orgSlug: 'org-1',
          orgStatus: 'ACTIVE',
          orgSubscriptionTier: 'starter',
          membershipId: 'mem-1',
          role: 'admin',
          isRevoked: false,
          refreshTokenHash: 'hash',
          issuedAt: 1,
        },
      },
    ]);
    tokenProvider.deleteOrgSessions = jest.fn().mockResolvedValue(undefined);
    authProvider.deleteUser = jest.fn().mockResolvedValue({ id: 'external-1' });

    const deps = {
      transactionManager: {
        runInTransaction: jest.fn(async (fn) => fn({})),
      },
      tokenProvider,
      authProvider,
      getMembershipService: jest.fn().mockResolvedValue([
        {
          membershipId: 'mem-1',
          userId: 'user-1',
          externalId: 'external-1',
        },
      ]),
      deleteOrgService: jest.fn().mockResolvedValue({ id: 'org-1' }),
      updateManyUsersService: jest.fn().mockResolvedValue([]),
      deleteManyMembershipService: jest.fn().mockResolvedValue([]),
      deleteInvitationsByFilter: jest.fn().mockResolvedValue(2),
      getUserActiveMembershipsCount: jest.fn().mockResolvedValue(0),
    };

    const result = await deleteOrganizationUseCase(
      {
        organizationId: 'org-1',
      },
      deps,
    );

    expect(result.success).toBe(true);
    expect(result.deletedMemberships).toBe(1);
    expect(result.deletedInvitations).toBe(2);
    expect(result.orphanedUsers).toBe(1);
    expect(tokenProvider.getOrgSessions).toHaveBeenCalledWith('org-1');
    expect(tokenProvider.deleteOrgSessions).toHaveBeenCalled();
    expect(authProvider.deleteUser).toHaveBeenCalledWith('external-1');
  });
});
