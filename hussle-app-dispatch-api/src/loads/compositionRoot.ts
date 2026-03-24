import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import { customerRepositoryPrisma } from '@/customers/repositories/customerRepositoryPrisma';
import { createAccessorialControllers } from './controllers/accessorialController';
import { createLoadControllers } from './controllers/loadController';
import { createStopControllers } from './controllers/stopController';
import { createTransitionStatusController } from './controllers/transitionStatusController';
import { createWeeklyGrossController } from './controllers/weeklyGrossController';
import {
  carrierAssignmentQueryPrisma,
  driverAssignmentQueryPrisma,
  loadRepositoryPrisma,
  orgSettingsQueryPrisma,
  vehicleAssignmentQueryPrisma,
} from './repositories/loadRepositoryPrisma';
import { loadStatusRepositoryPrisma } from './repositories/loadStatusRepositoryPrisma';
import { accessorialRepositoryPrisma } from './repositories/accessorialRepositoryPrisma';
import { stopRepositoryPrisma } from './repositories/stopRepositoryPrisma';
import { weeklyGrossQueryPrisma } from './repositories/weeklyGrossQueryPrisma';
import { createLoadService } from './services/loadService';
import type { LoadStatusService } from './services/loadStatusService';
import { createLoadStatusService } from './services/loadStatusService';
import { createAccessorialService } from './services/accessorialService';
import { createStopService } from './services/stopService';
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
  stopControllers: ReturnType<typeof createStopControllers>;
  accessorialControllers: ReturnType<typeof createAccessorialControllers>;
  loadStatusService: LoadStatusService;
} => {
  const loadRepository = loadRepositoryPrisma(prismaClient);
  const orgSettingsQuery = orgSettingsQueryPrisma(prismaClient);
  const carrierAssignmentQuery = carrierAssignmentQueryPrisma(prismaClient);
  const driverAssignmentQuery = driverAssignmentQueryPrisma(prismaClient);
  const vehicleAssignmentQuery = vehicleAssignmentQueryPrisma(prismaClient);
  const loadStatusRepo = loadStatusRepositoryPrisma(prismaClient);
  const weeklyGrossQuery = weeklyGrossQueryPrisma(prismaClient);

  const accessorialRepository = accessorialRepositoryPrisma(prismaClient);
  const stopRepository = stopRepositoryPrisma(prismaClient);
  const customerRepository = customerRepositoryPrisma(prismaClient);

  const loadService = createLoadService({
    loadRepository,
    orgSettingsQuery,
    carrierAssignmentQuery,
    driverAssignmentQuery,
    vehicleAssignmentQuery,
    customerQuery: customerRepository,
    loadStatusRepo,
    eventBus,
    logger,
  });

  const loadStatusService = createLoadStatusService({
    loadRepository,
    loadStatusRepo,
    eventBus,
    logger,
  });

  const accessorialService = createAccessorialService({
    accessorialRepository,
    loadRepository,
    eventBus,
  });

  const stopService = createStopService({
    stopRepository,
    loadRepository,
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

  const accessorialCtrls = createAccessorialControllers({
    accessorialService,
  });

  const stopCtrls = createStopControllers({
    stopService,
  });

  const controllers: LoadRouterControllers = {
    ...crudControllers,
    transitionStatus,
    getWeeklyGross,
  };

  return {
    controllers,
    stopControllers: stopCtrls,
    accessorialControllers: accessorialCtrls,
    loadStatusService,
  };
};
