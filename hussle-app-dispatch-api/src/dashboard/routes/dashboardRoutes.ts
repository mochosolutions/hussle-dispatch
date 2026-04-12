import { Router } from 'express';
import { requireAuth, requireRole } from '@/middleware/auth';
import { ROLES } from '@/config/roles';
import type { DashboardControllers } from '../controllers/dashboardController';
import type { PendingCarriersControllers } from '../controllers/pendingCarriersController';

export const createDashboardRouter = (
  controllers: DashboardControllers & PendingCarriersControllers,
): Router => {
  const router = Router();

  // GET /kpis — dashboard KPIs
  router.get(
    '/kpis',
    requireAuth,
    controllers.getKpis,
  );

  // GET /attention-items — items requiring attention
  router.get(
    '/attention-items',
    requireAuth,
    controllers.getAttentionItems,
  );

  // GET /pending-carriers — carriers with completed onboarding awaiting review
  router.get(
    '/pending-carriers',
    requireAuth,
    requireRole([ROLES.ADMIN, ROLES.DISPATCHER]),
    controllers.getPendingCarriers,
  );

  return router;
};
