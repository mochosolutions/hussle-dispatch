import { AuthRequestError } from '@/shared/errors/authError';
import { logger } from '@/shared/utils/logger';
import type { ITokenProvider } from '../../types/tokenProvider';

export interface RefreshTokenServiceDeps {
  tokenProvider: ITokenProvider;
}

export interface RefreshTokenInput {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

export const refreshUserTokenService = async (
  { refreshToken, ipAddress, userAgent }: RefreshTokenInput,
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
      ipAddress,
      userAgent,
    });

    logger.info('Token refresh completed successfully');
    return response;
  } catch (e) {
    logger.error('Error refreshing user token', { error: e });
    throw new AuthRequestError('Failed to refresh user token');
  }
};
export default refreshUserTokenService;
