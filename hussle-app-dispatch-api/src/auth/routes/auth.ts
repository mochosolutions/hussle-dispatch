import express from 'express';
import { appAuth } from '@/shared/middleware/authenticateUser';
import { authRateLimiter } from '@/shared/middleware/rateLimiter';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { AuthControllers } from '../controllers';
import { confirmForgotPasswordObjValidator } from '../validators/confirmForgotPasswordValidator';
import { confirmUserObjValidator } from '../validators/confirmUserValidator';
import { forgotPasswordObjValidator } from '../validators/forgotPasswordValidator';
import { passwordChallengeObjValidator } from '../validators/passwordChallengeValidator';
import { resendConfirmationCodeObjValidator } from '../validators/resendConfirmationCodeValidator';
import { signinObjValidator } from '../validators/signinValidator';
import { signupRequestObjValidator } from '../validators/signupOrgValidator';
import { switchOrgValidator } from '../validators/switchOrgValidator';

export const createUserAuthRouter = (controllers: AuthControllers): express.Router => {
  const router = express.Router();

  router.get('/auth/me', appAuth, controllers.getCurrentUserController);
  router.post('/auth/logout', appAuth, controllers.logoutController);
  router.post(
    '/auth/login',
    authRateLimiter,
    validateRequest(signinObjValidator),
    controllers.loginController,
  );
  router.post(
    '/auth/signup',
    authRateLimiter,
    validateRequest(signupRequestObjValidator),
    controllers.signupOrgController,
  );
  router.post(
    '/auth/signup/challenge',
    validateRequest(passwordChallengeObjValidator),
    controllers.passwordChallengeController,
  );
  router.post(
    '/auth/signup/confirm',
    validateRequest(confirmUserObjValidator),
    controllers.confirmUserSignUpController,
  );
  router.post(
    '/auth/signup/resend-code',
    validateRequest(resendConfirmationCodeObjValidator),
    controllers.resendConfirmationCodeController,
  );
  router.post(
    '/auth/password/reset',
    authRateLimiter,
    validateRequest(forgotPasswordObjValidator),
    controllers.forgotPasswordController,
  );
  router.post(
    '/auth/password/reset/confirm',
    validateRequest(confirmForgotPasswordObjValidator),
    controllers.confirmForgotPasswordController,
  );

  router.post('/auth/token/refresh', authRateLimiter, controllers.refreshTokenController);
  router.post(
    '/auth/switch-org',
    validateRequest(switchOrgValidator),
    appAuth,
    controllers.switchOrgController,
  );

  return router;
};
