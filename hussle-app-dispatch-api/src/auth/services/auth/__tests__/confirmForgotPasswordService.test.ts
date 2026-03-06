import { AuthRequestError } from '@/shared/errors/authError';
import type { IAuthProvider } from '../../../types/authProviderTypes';
import { confirmForgotPasswordService } from '../confirmForgotPasswordService';

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

describe('confirmForgotPasswordService', () => {
  it('confirms password reset with code and new password', async () => {
    const authProvider = buildAuthProvider();
    authProvider.confirmForgotPassword = jest.fn().mockResolvedValue({ success: true });

    const result = await confirmForgotPasswordService(
      {
        email: 'user@example.com',
        code: '123456',
        newPassword: 'new-password',
      },
      { authProvider },
    );

    expect(authProvider.confirmForgotPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      code: '123456',
      newPassword: 'new-password',
    });
    expect(result.success).toBe(true);
  });

  it('throws AuthRequestError on provider failure', async () => {
    const authProvider = buildAuthProvider();
    authProvider.confirmForgotPassword = jest.fn().mockRejectedValue(new Error('provider error'));

    await expect(
      confirmForgotPasswordService(
        {
          email: 'user@example.com',
          code: '123456',
          newPassword: 'new-password',
        },
        { authProvider },
      ),
    ).rejects.toBeInstanceOf(AuthRequestError);
  });
});
