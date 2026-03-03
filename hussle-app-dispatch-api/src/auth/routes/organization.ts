import express from 'express';
import { SystemUserRole } from '@/shared/constants/authConstants';
import { appAuth } from '@/shared/middleware/authenticateUser';
import { authorizeUser as authorizeUserMiddleware } from '@/shared/middleware/authorizeUser';
import { validateRequest } from '@/shared/middleware/validateRequest';
import {
  createOrganizationController,
  getOrganizationsController,
  getOrganizationsByIdController,
  updateOrganizationController,
  createOrgMembershipController,
  getMembershipController,
  deleteOrganizationController,
} from '../controllers';
import {
  createOrganizationValidator,
  getOrganizationsByIdValidator,
  updateOrganizationValidator,
  createMembershipValidator,
  getMembershipValidator,
  deleteOrganizationValidator,
} from '../validators/tenantValidator';

const router = express.Router();

const adminOrSupport = { role: [SystemUserRole.SYSTEM_ADMIN, SystemUserRole.CUSTOMER_SUPPORT] };
const adminOnly = { role: [SystemUserRole.SYSTEM_ADMIN] };

router.post(
  '/organizations',
  appAuth,
  authorizeUserMiddleware(adminOrSupport),
  validateRequest(createOrganizationValidator),
  createOrganizationController
);

router.get(
  '/organizations',
  appAuth,
  authorizeUserMiddleware(adminOrSupport),
  getOrganizationsController
);

router.get(
  '/organizations/:organizationId',
  appAuth,
  authorizeUserMiddleware(adminOrSupport),
  validateRequest(getOrganizationsByIdValidator),
  getOrganizationsByIdController
);

router.put(
  '/organizations/:organizationId',
  appAuth,
  authorizeUserMiddleware(adminOrSupport),
  validateRequest(updateOrganizationValidator),
  updateOrganizationController
);

router.delete(
  '/organizations/:organizationId',
  appAuth,
  authorizeUserMiddleware(adminOnly),
  validateRequest(deleteOrganizationValidator),
  deleteOrganizationController
);

router.post(
  '/organizations/:organizationId/membership',
  appAuth,
  authorizeUserMiddleware(adminOrSupport),
  validateRequest(createMembershipValidator),
  createOrgMembershipController
);

router.get(
  '/organizations/:organizationId/membership',
  appAuth,
  authorizeUserMiddleware(adminOrSupport),
  validateRequest(getMembershipValidator),
  getMembershipController
);

export { router as organizationRouter };
