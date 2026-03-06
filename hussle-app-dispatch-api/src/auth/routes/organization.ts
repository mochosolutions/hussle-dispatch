import express from 'express';
import { SystemUserRole } from '@/shared/constants/authConstants';
import { appAuth } from '@/shared/middleware/authenticateUser';
import { authorizeUser as authorizeUserMiddleware } from '@/shared/middleware/authorizeUser';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { AuthControllers } from '../controllers';
import {
  createOrganizationValidator,
  getOrganizationsByIdValidator,
  updateOrganizationValidator,
  createMembershipValidator,
  getMembershipValidator,
  deleteOrganizationValidator,
  updateMembershipValidator,
  deleteMembershipValidator,
} from '../validators/tenantValidator';

export const createOrganizationRouter = (controllers: AuthControllers): express.Router => {
  const router = express.Router();

  const adminOrSupport = { role: [SystemUserRole.SYSTEM_ADMIN, SystemUserRole.CUSTOMER_SUPPORT] };
  const adminOnly = { role: [SystemUserRole.SYSTEM_ADMIN] };

  router.post(
    '/organizations',
    appAuth,
    authorizeUserMiddleware(adminOrSupport),
    validateRequest(createOrganizationValidator),
    controllers.createOrganizationController,
  );

  router.get(
    '/organizations',
    appAuth,
    authorizeUserMiddleware(adminOrSupport),
    controllers.getOrganizationsController,
  );

  router.get(
    '/organizations/:organizationId',
    appAuth,
    authorizeUserMiddleware(adminOrSupport),
    validateRequest(getOrganizationsByIdValidator),
    controllers.getOrganizationsByIdController,
  );

  router.put(
    '/organizations/:organizationId',
    appAuth,
    authorizeUserMiddleware(adminOrSupport),
    validateRequest(updateOrganizationValidator),
    controllers.updateOrganizationController,
  );

  router.delete(
    '/organizations/:organizationId',
    appAuth,
    authorizeUserMiddleware(adminOnly),
    validateRequest(deleteOrganizationValidator),
    controllers.deleteOrganizationController,
  );

  router.post(
    '/organizations/:organizationId/membership',
    appAuth,
    authorizeUserMiddleware(adminOrSupport),
    validateRequest(createMembershipValidator),
    controllers.createOrgMembershipController,
  );

  router.get(
    '/organizations/:organizationId/membership',
    appAuth,
    authorizeUserMiddleware(adminOrSupport),
    validateRequest(getMembershipValidator),
    controllers.getMembershipController,
  );

  router.put(
    '/organizations/:organizationId/membership/:membershipId',
    appAuth,
    authorizeUserMiddleware(adminOrSupport),
    validateRequest(updateMembershipValidator),
    controllers.updateMembershipController,
  );

  router.delete(
    '/organizations/:organizationId/membership/:membershipId',
    appAuth,
    authorizeUserMiddleware(adminOnly),
    validateRequest(deleteMembershipValidator),
    controllers.deleteMembershipController,
  );

  return router;
};
