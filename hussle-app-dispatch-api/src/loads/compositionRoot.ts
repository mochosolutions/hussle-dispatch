import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import { createLoadControllers } from './controllers/loadController';
import { createTransitionStatusController } from './controllers/transitionStatusController';
import { createWeeklyGrossController } from './controllers/weeklyGrossController';
import { loadRepositoryPrisma, orgSettingsQueryPrisma } from './repositories/loadRepositoryPrisma';
import { loadStatusRepositoryPrisma } from './repositories/loadStatusRepositoryPrisma';
import { weeklyGrossQueryPrisma } from './repositories/weeklyGrossQueryPrisma';
import { createLoadService } from './services/loadService';
import { createLoadStatusService } from './services/loadStatusService';
import { createWeeklyGrossService } from './services/weeklyGrossService';
import type { LoadRouterControllers } from './routes/loadRoutes';

interface LoadModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  eventBus: EventBus;
  logger: Logger;
}

export const createLoadsModule = ({
  prismaClient,
  eventBus,
  logger,
}: LoadModuleDeps): {
  controllers: LoadRouterControllers;
} => {
  const loadRepository = loadRepositoryPrisma(prismaClient);
  const orgSettingsQuery = orgSettingsQueryPrisma(prismaClient);
  const loadStatusRepo = loadStatusRepositoryPrisma(prismaClient);
  const weeklyGrossQuery = weeklyGrossQueryPrisma(prismaClient);

  const loadService = createLoadService({
    loadRepository,
    orgSettingsQuery,
  });

  const loadStatusService = createLoadStatusService({
    loadRepository,
    loadStatusRepo,
    eventBus,
    logger,
  });

  const weeklyGrossService = createWeeklyGrossService({
    weeklyGrossQuery,
  });

  const crudControllers = createLoadControllers({
    loadService,
  });

  const transitionStatus = createTransitionStatusController({
    loadStatusService,
  });

  const getWeeklyGross = createWeeklyGrossController({
    weeklyGrossService,
  });

  const controllers: LoadRouterControllers = {
    ...crudControllers,
    transitionStatus,
    getWeeklyGross,
  };

  return { controllers };
};
