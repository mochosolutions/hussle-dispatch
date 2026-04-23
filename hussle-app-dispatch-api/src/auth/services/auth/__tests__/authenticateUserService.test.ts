import { AuthStatus } from '@/shared/constants/authConstants';
import { AuthRequestError } from '@/shared/errors/authError';
import type { IAuthProvider } from '../../../types/authProviderTypes';
import type { Membership } from '../../../types/membershipTypes';
import type { ITokenProvider } from '../../../types/tokenProvider';
import { authenticateUserService } from '../authenticateUserService';

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

describe('authenticateUserService', () => {
  const memberships: Membership[] = [
    {
      membershipId: 'mem-1',
      userId: 'user-1',
      organizationId: 'org-1',
      orgName: 'Org 1',
      orgSlug: 'org-1',
      orgSubscriptionTier: 'starter',
      orgStatus: 'ACTIVE',
      role: 'admin',
      permissionsVersion: 1,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('returns UNCONFIRMED when auth provider indicates unconfirmed challenge', async () => {
    const authProvider = buildAuthProvider();
    const tokenProvider = buildTokenProvider();

    authProvider.authenticateUser = jest.fn().mockResolvedValue({
      challengeName: 'UNCONFIRMED',
      user: { id: 'external-1' },
    });

    const result = await authenticateUserService(
      { username: 'user@example.com', password: 'secret' },
      {
        authProvider,
        tokenProvider,
        decodeToken: jest.fn(),
        findMemberByUserId: jest.fn(),
        findUserByExternalId: jest.fn(),
      },
    );

    expect(result.status).toBe(AuthStatus.UNCONFIRMED);
    expect(result.user.email).toBe('user@example.com');
  });

  it('returns authenticated payload with session tokens for active membership', async () => {
    const authProvider = buildAuthProvider();
    const tokenProvider = buildTokenProvider();

    authProvider.authenticateUser = jest.fn().mockResolvedValue({
      session: 'session-token',
      user: { id: 'external-1' },
    });

    tokenProvider.createSession = jest
      .fn()
      .mockResolvedValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });

    const findUserByExternalId = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });

    const findMemberByUserId = jest.fn().mockResolvedValue(memberships);

    const result = await authenticateUserService(
      { username: 'user@example.com', password: 'secret' },
      {
        authProvider,
        tokenProvider,
        decodeToken: jest.fn(),
        findMemberByUserId,
        findUserByExternalId,
      },
    );

    expect(result.status).toBe(AuthStatus.AUTHENTICATED);
    expect(result.user.organizationId).toBe('org-1');
    expect(result.token?.accessToken).toBe('access-token');
    expect(result.token?.refreshToken).toBe('refresh-token');
  });

  it('throws AuthRequestError when database user does not exist', async () => {
    const authProvider = buildAuthProvider();
    const tokenProvider = buildTokenProvider();

    authProvider.authenticateUser = jest.fn().mockResolvedValue({
      session: 'session-token',
      user: { id: 'external-missing' },
    });

    await expect(
      authenticateUserService(
        { username: 'missing@example.com', password: 'secret' },
        {
          authProvider,
          tokenProvider,
          decodeToken: jest.fn(),
          findMemberByUserId: jest.fn().mockResolvedValue([]),
          findUserByExternalId: jest.fn().mockResolvedValue(null),
        },
      ),
    ).rejects.toBeInstanceOf(AuthRequestError);
  });

  it('throws AuthRequestError when all memberships have inactive status', async () => {
    const authProvider = buildAuthProvider();
    const tokenProvider = buildTokenProvider();

    authProvider.authenticateUser = jest.fn().mockResolvedValue({
      session: 'session-token',
      user: { id: 'external-1' },
    });

    const inactiveMemberships: Membership[] = [
      {
        membershipId: 'mem-1',
        userId: 'user-1',
        organizationId: 'org-1',
        orgName: 'Org 1',
        orgSlug: 'org-1',
        orgSubscriptionTier: 'starter',
        orgStatus: 'ACTIVE',
        role: 'admin',
        permissionsVersion: 1,
        status: 'inactive',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    await expect(
      authenticateUserService(
        { username: 'user@example.com', password: 'secret' },
        {
          authProvider,
          tokenProvider,
          decodeToken: jest.fn(),
          findMemberByUserId: jest.fn().mockResolvedValue(inactiveMemberships),
          findUserByExternalId: jest.fn().mockResolvedValue({
            id: 'user-1',
            email: 'user@example.com',
            firstName: 'Jane',
            lastName: 'Doe',
          }),
        },
      ),
    ).rejects.toBeInstanceOf(AuthRequestError);
  });
});
