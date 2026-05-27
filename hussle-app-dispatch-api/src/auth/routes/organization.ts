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
import {
  changeRoleValidator,
  removeMemberValidator,
} from '../validators/memberManagementValidator';

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

  // Member management routes (tenant admin)
  const tenantAdmin = { role: 'admin' };

  router.get(
    '/organizations/:organizationId/subscription/usage',
    appAuth,
    authorizeUserMiddleware(tenantAdmin),
    controllers.getSubscriptionUsageController,
  );

  router.get(
    '/organizations/:organizationId/members',
    appAuth,
    authorizeUserMiddleware(tenantAdmin),
    controllers.listMembersController,
  );

  router.patch(
    '/organizations/:organizationId/members/:membershipId/role',
    appAuth,
    authorizeUserMiddleware(tenantAdmin),
    validateRequest(changeRoleValidator),
    controllers.changeMemberRoleController,
  );

  router.delete(
    '/organizations/:organizationId/members/:membershipId',
    appAuth,
    authorizeUserMiddleware(tenantAdmin),
    validateRequest(removeMemberValidator),
    controllers.removeMemberController,
  );

  return router;
};
