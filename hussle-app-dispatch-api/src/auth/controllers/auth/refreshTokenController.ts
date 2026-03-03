import type { Request, Response } from 'express';
import { redisClient as redis } from '@/shared/redisClient';
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/shared/utils/cookieUtils';
import { logger } from '@/shared/utils/logger';
import { tokenProvider } from '../../providers/tokenProvider';
import { refreshUserTokenService } from '../../services';

export const refreshTokenController = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    const tokenProviderInstance = tokenProvider({ client: redis });

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token found' });
    }

    const newTokens = await refreshUserTokenService(
      { refreshToken },
      { tokenProvider: tokenProviderInstance }
    );
    if (!newTokens) {
      return res.status(401).json({ error: 'No refresh token found' });
    }

    const { accessToken, refreshToken: newRefreshToken } = newTokens;

    // Set both tokens as HttpOnly cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, newRefreshToken);

    return res.status(200).json({
      message: 'Token refreshed successfully',
    });
  } catch (error: unknown) {
    logger.error('Token refresh failed', { correlationId: req.correlationId });
    return res.status(400).json({ error: 'Token refresh failed' });
  }
};

export default refreshTokenController;
