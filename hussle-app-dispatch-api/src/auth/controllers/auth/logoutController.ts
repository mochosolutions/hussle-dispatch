import type { NextFunction, Request, Response } from 'express';
import { redisClient as redis } from '@/shared/redisClient';
import { clearAuthCookies } from '@/shared/utils/cookieUtils';
import { tokenProvider } from '../../providers/tokenProvider';
import { logoutUserService } from '../../services';

export const logoutController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.user?.sessionId;
    const refreshToken = req.cookies?.refreshToken;

    if (!sessionId || !refreshToken) {
      return res.status(400).json({ error: 'Session ID or refresh token is missing' });
    }
    const tokenProviderInstance = tokenProvider({ client: redis });
    await logoutUserService({ sessionId, refreshToken }, { tokenProvider: tokenProviderInstance });

    // Clear both auth cookies
    clearAuthCookies(res);

    return res.status(200).json({ message: 'User logged out successfully' });
  } catch (error) {
    return next(error);
  }
};

export default logoutController;
