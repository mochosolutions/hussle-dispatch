import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';
import type { ConfirmUserInput, ConfirmUserServiceDeps } from '../../types/authProviderTypes';

export const confirmUserService = async (
  { confirmationCode, username }: ConfirmUserInput,
  { authProvider }: ConfirmUserServiceDeps
) => {
  try {
    const response = await authProvider.confirmUser({
      username,
      confirmationCode,
    });
    return response;
  } catch (e) {
    logger.error('Error confirming user', { error: e });
    throw new AuthRequestError('Failed to confirmUser tenant');
  }
};

export default confirmUserService;
