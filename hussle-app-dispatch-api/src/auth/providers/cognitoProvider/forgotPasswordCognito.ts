import { logger } from '@/shared/utils/logger';
import { forgotPasswordCognito } from '@/shared/utils/cognito';
import { AuthRequestError } from '@/shared/errors/authError';
import type { ForgotPasswordDeps, ForgotPasswordInput } from '../../types/authProviderTypes';

export const forgotPassword = async (
  { email }: ForgotPasswordInput,
  { client, clientId }: ForgotPasswordDeps
) => {
  try {
    logger.info('forgotPassword initiated');
    const response = await forgotPasswordCognito({
      client,
      clientId,
      username: email,
    });
    return response;
  } catch (error) {
    logger.error('Error in forgotPassword', { error });
    throw new AuthRequestError('Failed to initiate password reset');
  }
};
