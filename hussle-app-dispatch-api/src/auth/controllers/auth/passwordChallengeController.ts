import type { NextFunction, Request, Response } from 'express';
import { getClientId } from '@/shared/utils/cognito';
import { logger } from '@/shared/utils/logger';
import { cognitoIdentityClient } from '@/shared/utils/cognito';
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/shared/utils/cookieUtils';
import { cognitoProvider } from '../../providers/authProvider';
import { passwordChallengeService } from '../../services';

export const passwordChallengeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, session, challengeName } = req.body;
    const { clientId, userPoolId } = await getClientId();
    const authProvider = cognitoProvider({ client: cognitoIdentityClient, userPoolId, clientId });
    logger.info('passwordChallengeController', { email, challengeName });

    const authResponse = await passwordChallengeService(
      {
        session,
        username: email,
        newPassword: password,
      },
      { authProvider }
    );

    // Set both tokens as HttpOnly cookies
    if (authResponse?.accessToken) {
      setAccessTokenCookie(res, authResponse.accessToken);
    }
    if (authResponse?.refreshToken) {
      setRefreshTokenCookie(res, authResponse.refreshToken);
    }

    return res.status(200).json({
      status: 'authenticated',
      session: authResponse?.session,
      message: 'User responded to new password challenge successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export default passwordChallengeController;
