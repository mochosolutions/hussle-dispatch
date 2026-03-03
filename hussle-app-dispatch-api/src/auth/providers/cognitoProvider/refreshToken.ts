import { logger } from '@/shared/utils/logger';
import { refreshCognitoUserToken } from '@/shared/utils/cognito';
import { AuthRequestError } from '@/shared/errors/authError';
import type { RefreshTokenDeps } from '../../types/authProviderTypes';

export const refreshToken = async (
  { refreshToken }: { refreshToken: string },
  { client, clientId }: RefreshTokenDeps
) => {
  try {
    const response = await refreshCognitoUserToken({
      client,
      clientId,
      refreshToken,
    });
    return response;
  } catch (error) {
    logger.error('Error refreshing token', { error });
    throw new AuthRequestError('Failed to refresh token');
  }
};
