import type { IAuthProvider } from '../../../types/authProviderTypes';
import { passwordChallengeService } from '../passwordChallengeService';

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

describe('passwordChallengeService', () => {
  it('delegates to auth provider with challenge payload', async () => {
    const authProvider = buildAuthProvider();
    const mockResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      idToken: 'id-token',
      expiresIn: 3600,
      challengeName: '',
      challengeParams: { userID: 'user-1', requiredAttributes: [], userAttributes: [] },
    };
    authProvider.passwordChallenge = jest.fn().mockResolvedValue(mockResponse);

    const result = await passwordChallengeService(
      {
        username: 'user@example.com',
        newPassword: 'new-password',
        session: 'challenge-session',
      },
      { authProvider },
    );

    expect(authProvider.passwordChallenge).toHaveBeenCalledWith({
      username: 'user@example.com',
      newPassword: 'new-password',
      session: 'challenge-session',
    });
    expect(result).toBe(mockResponse);
  });

  it('rethrows upstream provider error', async () => {
    const authProvider = buildAuthProvider();
    const providerError = new Error('challenge failed');
    authProvider.passwordChallenge = jest.fn().mockRejectedValue(providerError);

    await expect(
      passwordChallengeService(
        {
          username: 'user@example.com',
          newPassword: 'new-password',
          session: 'challenge-session',
        },
        { authProvider },
      ),
    ).rejects.toThrow('challenge failed');
  });
});
