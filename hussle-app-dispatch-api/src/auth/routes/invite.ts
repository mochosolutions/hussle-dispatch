import express from 'express';
import { appAuth } from '@/shared/middleware/authenticateUser';
import { authorizeUser } from '@/shared/middleware/authorizeUser';
import { requireAuthOrInviteToken } from '@/shared/middleware/requireAuthOrInviteToken';
import { validateRequest } from '@/shared/middleware/validateRequest';
import { ROLES } from '@/config/roles';
import type { AuthControllers } from '../controllers';
import { acceptInviteValidator } from '../validators/acceptInviteValidator';
import { getMembershipValidator, inviteUserValidator, verifyInviteValidator } from '../validators/tenantValidator';

export const createInviteRouter = (controllers: AuthControllers): express.Router => {
  const router = express.Router();

  const tenantAdmin = { role: ROLES.ADMIN };

  router.post(
    '/organizations/:organizationId/invite',
    appAuth,
    authorizeUser(tenantAdmin),
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
    authorizeUser(tenantAdmin),
    validateRequest(getMembershipValidator),
    controllers.getInvitesController,
  );

  return router;
};
