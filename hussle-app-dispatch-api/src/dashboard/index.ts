import { prisma } from '@/shared/prisma';
import { logger } from '@/shared/utils/logger';
import { createDashboardModule } from './compositionRoot';
import { createDashboardRouter } from './routes/dashboardRoutes';

const dashboardModule = createDashboardModule({
  prismaClient: prisma,
  logger,
});

export const dashboardRouter = createDashboardRouter(dashboardModule.controllers);
