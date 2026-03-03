import { logger } from '@/shared/utils/logger';
import { confirmForgotPasswordCognito } from '@/shared/utils/cognito';
import { AuthRequestError } from '@/shared/errors/authError';
import type {
  ConfirmForgotPasswordDeps,
  ConfirmForgotPasswordInput,
} from '../../types/authProviderTypes';

export const confirmForgotPassword = async (
  args: ConfirmForgotPasswordInput,
  deps: ConfirmForgotPasswordDeps
) => {
  try {
    const { email, code, newPassword } = args;
    const { client, clientId } = deps;
    const response = await confirmForgotPasswordCognito({
      client,
      clientId,
      username: email,
      confirmationCode: code,
      newPassword,
    });
    // const {} = response; // Assuming the response is not used, but we can log or handle it if needed
    return {
      success: true,
      message: 'Password reset successfully.',
    };
  } catch (error) {
    logger.error('Error in confirmForgotPassword', { error });
    throw new AuthRequestError('Failed to confirm forgot password');
  }
};
