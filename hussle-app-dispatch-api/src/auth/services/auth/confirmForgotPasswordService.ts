import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';
import type {
  ConfirmForgotPasswordInput,
  ConfirmForgotPasswordServiceDeps,
} from '../../types/authProviderTypes';

export const confirmForgotPasswordService = async (
  { email, code, newPassword }: ConfirmForgotPasswordInput,
  { authProvider }: ConfirmForgotPasswordServiceDeps
) => {
  try {
    const response = await authProvider.confirmForgotPassword({ email, code, newPassword });
    return response;
  } catch (e) {
    logger.error('Error confirming forgot password', { error: e });
    throw new AuthRequestError('Failed to send forgot password');
  }
};
