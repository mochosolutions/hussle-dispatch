import { LocationClient } from '@aws-sdk/client-location';
import type { PrismaClient } from '@prisma/client';
import type { Redis } from 'ioredis';
import { env } from '@/config/env';
import type { EventBus } from '@/shared/messaging/eventBus';
import { createAwsRouteCalculator } from '@/shared/routing/awsRouteCalculator';
import { createCachedRouteCalculator } from '@/shared/routing/routeCache';
import type { Logger } from '@/shared/utils/logger';
import { createIftaReportController } from './controllers/iftaReportController';
import { createStateMilesControllers } from './controllers/stateMilesController';
import { iftaReportQueryPrisma } from './repositories/iftaReportQueryPrisma';
import { loadMileageUpdatePrisma } from './repositories/loadMileageUpdatePrisma';
import { stateMilesRepositoryPrisma } from './repositories/stateMilesRepositoryPrisma';
import { stopCoordinateQueryPrisma } from './repositories/stopCoordinateQueryPrisma';
import { createIftaReportService } from './services/iftaReportService';
import type { StateMileageService } from './services/stateMileageService';
import { createStateMileageService } from './services/stateMileageService';
import { initializeStateMileageSubscriber } from './services/stateMileageSubscriber';
import { createStateMilesOverrideService } from './services/stateMilesOverrideService';

interface IftaModuleDeps {
  prismaClient: PrismaClient;
  redis: Redis;
  eventBus: EventBus;
  logger: Logger;
}

export const createIftaModule = (deps: IftaModuleDeps) => {
  const { prismaClient, redis, logger } = deps;

  // --- Repositories ---
  const stateMilesRepo = stateMilesRepositoryPrisma(prismaClient);
  const stopCoordinateQuery = stopCoordinateQueryPrisma(prismaClient);
  const loadMileageUpdate = loadMileageUpdatePrisma(prismaClient);
  const iftaReportQuery = iftaReportQueryPrisma(prismaClient);

  // --- Route calculator (conditional) ---
  let stateMileageService: StateMileageService | null = null;

  const calculatorName = env.AWS_LOCATION_ROUTE_CALCULATOR_NAME;
  const calculatorEnabled = env.ROUTE_CALCULATOR_ENABLED;

  if (calculatorName && calculatorEnabled) {
    const locationClient = new LocationClient({ region: env.AWS_REGION });
    const awsCalculator = createAwsRouteCalculator({
      locationClient,
      calculatorName,
      logger,
    });
    const routeCalculator = createCachedRouteCalculator({
      inner: awsCalculator,
      redis,
      logger,
    });

    stateMileageService = createStateMileageService({
      routeCalculator,
      stateMilesRepo,
      loadMileageUpdate,
      stopQuery: stopCoordinateQuery,
      logger,
    });
  } else {
    logger.info('Route calculator not configured, state mileage auto-calculation disabled');
  }

  // --- Services ---
  const stateMilesOverrideService = createStateMilesOverrideService({
    stateMilesRepo,
    logger,
  });

  const iftaReportService = createIftaReportService({
    iftaReportQuery,
    logger,
  });

  // --- Controllers ---
  const stateMilesControllers = createStateMilesControllers({
    stateMilesOverrideService,
  });

  const iftaReportController = createIftaReportController({
    iftaReportService,
  });

  // --- Subscriber ---
  const initializeSubscriber = stateMileageService
    ? async () =>
        initializeStateMileageSubscriber({
          eventBus: deps.eventBus,
          stateMileageService: stateMileageService as StateMileageService,
          logger: deps.logger,
        })
    : async () => {
        deps.logger.info('IFTA state mileage subscriber skipped (no route calculator)');
      };

  return {
    stateMilesControllers,
    iftaReportController,
    initializeSubscriber,
  };
};
