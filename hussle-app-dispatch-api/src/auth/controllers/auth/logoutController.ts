import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { AuthRequestError } from '@/shared/errors';
import { clearAuthCookies } from '@/shared/utils/cookieUtils';
import { tokenProvider } from '../../providers/tokenProvider';
import { logoutUserService } from '../../services';

interface LogoutControllerDeps {
  tokenProviderInstance: ReturnType<typeof tokenProvider>;
}

export const createLogoutController = ({
  tokenProviderInstance,
}: LogoutControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const sessionId = req.user?.sessionId;
    const refreshToken = req.cookies?.refreshToken;

    if (!sessionId || !refreshToken) {
      throw new AuthRequestError('Session ID or refresh token is missing');
    }

    await logoutUserService(
      { sessionId, refreshToken },
      { tokenProvider: tokenProviderInstance },
    );

    clearAuthCookies(res);

    return res.status(200).json({ message: 'User logged out successfully' });
  };
