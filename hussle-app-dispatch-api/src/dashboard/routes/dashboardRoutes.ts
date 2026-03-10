import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import type { DashboardControllers } from '../controllers/dashboardController';

export const createDashboardRouter = (controllers: DashboardControllers): Router => {
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

  return router;
};
