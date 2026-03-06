import { AuthRequestError } from '@/shared/errors/authError';
import type { IAuthProvider } from '../../../types/authProviderTypes';
import { resendConfirmationCodeService } from '../resendConfirmationCodeService';

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

describe('resendConfirmationCodeService', () => {
  it('resends confirmation code via auth provider', async () => {
    const authProvider = buildAuthProvider();
    authProvider.resendConfirmationCode = jest
      .fn()
      .mockResolvedValue({ success: true, message: 'sent' });

    const result = await resendConfirmationCodeService(
      { email: 'user@example.com' },
      { authProvider },
    );

    expect(authProvider.resendConfirmationCode).toHaveBeenCalledWith({
      email: 'user@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('throws AuthRequestError when provider call fails', async () => {
    const authProvider = buildAuthProvider();
    authProvider.resendConfirmationCode = jest.fn().mockRejectedValue(new Error('provider error'));

    await expect(
      resendConfirmationCodeService({ email: 'user@example.com' }, { authProvider }),
    ).rejects.toBeInstanceOf(AuthRequestError);
  });
});
