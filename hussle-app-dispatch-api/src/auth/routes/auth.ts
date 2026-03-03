import express from 'express';
import { appAuth } from '@/shared/middleware/authenticateUser';
import { authRateLimiter } from '@/shared/middleware/rateLimiter';
import { validateRequest } from '@/shared/middleware/validateRequest';
import {
  signupOrgController,
  loginController,
  logoutController,
  getCurrentUserController,
  refreshTokenController,
  // acceptInviteController,
  confirmForgotPasswordController,
  forgotPasswordController,
  passwordChallengeController,
  confirmUserSignUpController,
  switchOrgController,
  resendConfirmationCodeController,
} from '../controllers';
import { confirmForgotPasswordObjValidator } from '../validators/confirmForgotPasswordValidator';
import { confirmUserObjValidator } from '../validators/confirmUserValidator';
import { forgotPasswordObjValidator } from '../validators/forgotPasswordValidator';
import { passwordChallengeObjValidator } from '../validators/passwordChallengeValidator';
import { resendConfirmationCodeObjValidator } from '../validators/resendConfirmationCodeValidator';
import { signinObjValidator } from '../validators/signinValidator';
import { signupRequestObjValidator } from '../validators/signupOrgValidator';
import { switchOrgValidator } from '../validators/switchOrgValidator';

const router = express.Router();

router.get('/auth/me', appAuth, getCurrentUserController);
router.post('/auth/logout', appAuth, logoutController);
router.post('/auth/login', authRateLimiter, validateRequest(signinObjValidator), loginController);
router.post(
  '/auth/signup',
  authRateLimiter,
  validateRequest(signupRequestObjValidator),
  signupOrgController
);
router.post(
  '/auth/signup/challenge',
  validateRequest(passwordChallengeObjValidator),
  passwordChallengeController
);
router.post(
  '/auth/signup/confirm',
  validateRequest(confirmUserObjValidator),
  confirmUserSignUpController
);
router.post(
  '/auth/signup/resend-code',
  validateRequest(resendConfirmationCodeObjValidator),
  resendConfirmationCodeController
);
router.post(
  '/auth/password/reset',
  authRateLimiter,
  validateRequest(forgotPasswordObjValidator),
  forgotPasswordController
);
router.post(
  '/auth/password/reset/confirm',
  validateRequest(confirmForgotPasswordObjValidator),
  confirmForgotPasswordController
);
// router.post("/auth/signup/invited-user", validateRequest(resendConfirmationCodeObjValidator), acceptInviteController);

router.post('/auth/token/refresh', authRateLimiter, refreshTokenController);
router.post('/auth/switch-org', validateRequest(switchOrgValidator), appAuth, switchOrgController);

export { router as userAuthRouter };
