import type { Request, RequestHandler, Response } from 'express';
import { logger } from '@/shared/utils/logger';
import {
  generateCsrfToken,
  setAccessTokenCookie,
  setCsrfTokenCookie,
  setRefreshTokenCookie,
} from '@/shared/utils/cookieUtils';
import { cognitoProvider } from '../../providers/authProvider';
import { passwordChallengeService } from '../../services';
import { mapPasswordChallengeRequest } from './mappers/mapPasswordChallengeRequest';

interface PasswordChallengeControllerDeps {
  getAuthProvider: () => Promise<ReturnType<typeof cognitoProvider>>;
}

export const createPasswordChallengeController = ({
  getAuthProvider,
}: PasswordChallengeControllerDeps): RequestHandler => {
  return async (req: Request, res: Response) => {
    const { email, password, session, challengeName } = mapPasswordChallengeRequest(req);
    const authProvider = await getAuthProvider();
    logger.info('passwordChallengeController', { email, challengeName });

    const authResponse = await passwordChallengeService(
      {
        session,
        username: email,
        newPassword: password,
      },
      { authProvider },
    );

    if (authResponse?.accessToken) {
      setAccessTokenCookie(res, authResponse.accessToken);
      setCsrfTokenCookie(res, generateCsrfToken());
    }
    if (authResponse?.refreshToken) {
      setRefreshTokenCookie(res, authResponse.refreshToken);
    }

    return res.status(200).json({
      status: 'authenticated',
      session: authResponse?.session,
      message: 'User responded to new password challenge successfully',
    });
  };
};
