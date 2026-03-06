import { AuthRequestError } from '@/shared/errors/authError';
import type { IAuthProvider } from '../../../types/authProviderTypes';
import { forgotPasswordService } from '../forgotPasswordService';

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

describe('forgotPasswordService', () => {
  it('sends forgot password request via auth provider', async () => {
    const authProvider = buildAuthProvider();
    const mockResponse = { CodeDeliveryDetails: { Destination: 'u***@example.com' }, $metadata: {} };
    authProvider.forgotPassword = jest.fn().mockResolvedValue(mockResponse);

    const result = await forgotPasswordService({ email: 'user@example.com' }, { authProvider });

    expect(authProvider.forgotPassword).toHaveBeenCalledWith({ email: 'user@example.com' });
    expect(result).toBe(mockResponse);
  });

  it('throws AuthRequestError when provider fails', async () => {
    const authProvider = buildAuthProvider();
    authProvider.forgotPassword = jest.fn().mockRejectedValue(new Error('provider error'));

    await expect(
      forgotPasswordService({ email: 'user@example.com' }, { authProvider }),
    ).rejects.toBeInstanceOf(AuthRequestError);
  });
});
