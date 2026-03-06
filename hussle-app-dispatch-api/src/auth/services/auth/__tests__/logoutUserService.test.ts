import { AuthRequestError } from '@/shared/errors/authError';
import type { ITokenProvider } from '../../../types/tokenProvider';
import { logoutUserService } from '../logoutUserService';

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

describe('logoutUserService', () => {
  it('revokes the session with provided session and refresh token', async () => {
    const tokenProvider = buildTokenProvider();
    tokenProvider.revokeSession = jest.fn().mockResolvedValue(undefined);

    await logoutUserService(
      {
        sessionId: 'session-1',
        refreshToken: 'refresh-1',
      },
      { tokenProvider },
    );

    expect(tokenProvider.revokeSession).toHaveBeenCalledWith({
      sessionId: 'session-1',
      refreshToken: 'refresh-1',
    });
  });

  it('throws AuthRequestError when revoke fails', async () => {
    const tokenProvider = buildTokenProvider();
    tokenProvider.revokeSession = jest.fn().mockRejectedValue(new Error('redis down'));

    await expect(
      logoutUserService(
        {
          sessionId: 'session-1',
          refreshToken: 'refresh-1',
        },
        { tokenProvider },
      ),
    ).rejects.toBeInstanceOf(AuthRequestError);
  });
});
