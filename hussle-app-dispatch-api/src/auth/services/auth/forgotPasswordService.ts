import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';
import type { ForgotPasswordInput, ForgotPasswordServiceDeps } from '../../types/authProviderTypes';

export const forgotPasswordService = async (
  { email }: ForgotPasswordInput,
  { authProvider }: ForgotPasswordServiceDeps
) => {
  try {
    // const {clientId} = await getClientId();
    const response = await authProvider.forgotPassword({ email });
    return response;
  } catch (e) {
    logger.error('Error sending forgot password', { error: e });
    throw new AuthRequestError('Failed to send forgot password');
  }
};
