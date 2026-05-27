import express from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { CustomerControllers } from '../controllers/customerController';
import {
  createCustomerSchema,
  customerIdParamSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from '../validators/customerValidators';

export const createCustomersRouter = (controllers: CustomerControllers): express.Router => {
  const router = express.Router();

  router.post(
    '/',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(createCustomerSchema),
    controllers.createCustomer,
  );

  router.get(
    '/',
    requireAuth,
    validateRequest(listCustomersQuerySchema),
    controllers.listCustomers,
  );

  router.get(
    '/:id/stats',
    requireAuth,
    validateRequest(customerIdParamSchema),
    controllers.getCustomerStats,
  );

  router.get(
    '/:id',
    requireAuth,
    validateRequest(customerIdParamSchema),
    controllers.getCustomerById,
  );

  router.patch(
    '/:id',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    validateRequest(updateCustomerSchema),
    controllers.updateCustomer,
  );

  router.delete(
    '/:id',
    requireAuth,
    requireRole([ROLES.ADMIN]),
    validateRequest(customerIdParamSchema),
    controllers.deleteCustomer,
  );

  return router;
};
