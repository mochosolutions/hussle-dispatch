import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';
import type { ResendConfirmCodeInput, ResendConfirmDeps } from '../../types/authProviderTypes';

export const resendConfirmationCodeService = async (
  data: ResendConfirmCodeInput,
  deps: ResendConfirmDeps
) => {
  try {
    const { email } = data;
    const { authProvider } = deps;
    const response = await authProvider.resendConfirmationCode({ email });
    return response;
  } catch (e) {
    logger.error('Error resending confirmation code', { error: e });
    throw new AuthRequestError('Failed to resend confirmation code');
  }
};
