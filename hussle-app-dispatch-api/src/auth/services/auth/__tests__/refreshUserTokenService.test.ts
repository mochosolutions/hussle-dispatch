import { AuthRequestError } from '@/shared/errors/authError';
import type { ITokenProvider } from '../../../types/tokenProvider';
import { refreshUserTokenService } from '../refreshUserTokenService';

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

describe('refreshUserTokenService', () => {
  it('refreshes token when refresh token is valid', async () => {
    const tokenProvider = buildTokenProvider();
    tokenProvider.verifyRefreshToken = jest.fn().mockResolvedValue({ sessionId: 'session-1' });
    tokenProvider.refreshToken = jest
      .fn()
      .mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' });

    const result = await refreshUserTokenService(
      { refreshToken: 'refresh-token' },
      { tokenProvider },
    );

    expect(tokenProvider.verifyRefreshToken).toHaveBeenCalledWith({
      refreshToken: 'refresh-token',
    });
    expect(tokenProvider.refreshToken).toHaveBeenCalledWith({ refreshToken: 'refresh-token' });
    expect(result?.accessToken).toBe('new-access');
  });

  it('throws AuthRequestError when refresh token is invalid', async () => {
    const tokenProvider = buildTokenProvider();
    tokenProvider.verifyRefreshToken = jest.fn().mockResolvedValue(null);

    await expect(
      refreshUserTokenService({ refreshToken: 'bad-token' }, { tokenProvider }),
    ).rejects.toBeInstanceOf(AuthRequestError);

    expect(tokenProvider.refreshToken).not.toHaveBeenCalled();
  });
});
