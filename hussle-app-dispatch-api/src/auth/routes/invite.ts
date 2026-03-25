import express from 'express';
import { appAuth } from '@/shared/middleware/authenticateUser';
import { requireAuthOrInviteToken } from '@/shared/middleware/requireAuthOrInviteToken';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { AuthControllers } from '../controllers';
import { acceptInviteValidator } from '../validators/acceptInviteValidator';
import { getMembershipValidator, inviteUserValidator, verifyInviteValidator } from '../validators/tenantValidator';

export const createInviteRouter = (controllers: AuthControllers): express.Router => {
  const router = express.Router();

  router.post(
    '/organizations/:organizationId/invite',
    appAuth,
    validateRequest(inviteUserValidator),
    controllers.inviteUserController,
  );

  router.get(
    '/organizations/:organizationId/verify-invite',
    requireAuthOrInviteToken,
    validateRequest(verifyInviteValidator),
    controllers.verifyInviteController,
  );

  router.post(
    '/invitations/:token/verify',
    controllers.verifyInviteByTokenController,
  );

  router.post(
    '/invitations/accept',
    validateRequest(acceptInviteValidator),
    controllers.acceptInviteController,
  );

  router.get(
    '/organizations/:organizationId/invites',
    appAuth,
    validateRequest(getMembershipValidator),
    controllers.getInvitesController,
  );

  return router;
};
