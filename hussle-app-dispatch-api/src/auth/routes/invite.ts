import express from 'express';
import { appAuth } from '@/shared/middleware/authenticateUser';
import { requireAuthOrInviteToken } from '@/shared/middleware/requireAuthOrInviteToken';
import { validateRequest } from '@/shared/middleware/validateRequest';
import { inviteUserController, verifyInviteController } from '../controllers';
import { inviteUserValidator, verifyInviteValidator } from '../validators/tenantValidator';

const router = express.Router();

router.post(
  '/organizations/:organizationId/invite',
  appAuth,
  validateRequest(inviteUserValidator),
  inviteUserController
);

router.get(
  '/organizations/:organizationId/verify-invite',
  requireAuthOrInviteToken,
  validateRequest(verifyInviteValidator),
  verifyInviteController
);

export { router as inviteRouter };
