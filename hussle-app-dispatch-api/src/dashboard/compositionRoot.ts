import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { Logger } from '@/shared/utils/logger';
import { dashboardQueryPrisma } from './repositories/dashboardQueryPrisma';
import { createDashboardService } from './services/dashboardService';
import { createDashboardControllers } from './controllers/dashboardController';
import type { DashboardControllers } from './controllers/dashboardController';

interface DashboardModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  logger: Logger;
}

export const createDashboardModule = ({
  prismaClient,
}: DashboardModuleDeps): {
  controllers: DashboardControllers;
} => {
  const dashboardQuery = dashboardQueryPrisma(prismaClient);

  const dashboardService = createDashboardService({
    dashboardQuery,
  });

  const controllers = createDashboardControllers({
    dashboardService,
  });

  return { controllers };
};
