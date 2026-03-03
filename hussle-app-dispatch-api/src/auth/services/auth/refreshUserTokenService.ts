import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';
import type { ITokenProvider } from '../../types/tokenProvider';

export interface RefreshTokenServiceDeps {
  tokenProvider: ITokenProvider;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export const refreshUserTokenService = async (
  { refreshToken }: RefreshTokenInput,
  { tokenProvider }: RefreshTokenServiceDeps
) => {
  try {
    const isRefereshTokenValid = await tokenProvider.verifyRefreshToken({
      refreshToken,
    });

    logger.info('Refresh token validation result', { isValid: !!isRefereshTokenValid });

    if (!isRefereshTokenValid) {
      throw new AuthRequestError('Invalid refresh token');
    }
    const response = await tokenProvider.refreshToken({
      refreshToken,
    });

    logger.info('Token refresh completed successfully');
    return response;
  } catch (e) {
    logger.error('Error refreshing user token', { error: e });
    throw new AuthRequestError('Failed to refresh user token');
  }
};
export default refreshUserTokenService;
