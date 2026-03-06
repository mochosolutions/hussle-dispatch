import { AuthRequestError } from '@/shared/errors/authError';
import type { IAuthProvider } from '../../../types/authProviderTypes';
import { confirmUserService } from '../confirmUserService';

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

describe('confirmUserService', () => {
  it('confirms user registration via auth provider', async () => {
    const authProvider = buildAuthProvider();
    authProvider.confirmUser = jest.fn().mockResolvedValue({ success: true, message: 'ok' });

    const result = await confirmUserService(
      { username: 'user@example.com', confirmationCode: '654321' },
      { authProvider },
    );

    expect(authProvider.confirmUser).toHaveBeenCalledWith({
      username: 'user@example.com',
      confirmationCode: '654321',
    });
    expect(result.success).toBe(true);
  });

  it('throws AuthRequestError when provider call fails', async () => {
    const authProvider = buildAuthProvider();
    authProvider.confirmUser = jest.fn().mockRejectedValue(new Error('provider error'));

    await expect(
      confirmUserService(
        { username: 'user@example.com', confirmationCode: '654321' },
        { authProvider },
      ),
    ).rejects.toBeInstanceOf(AuthRequestError);
  });
});
