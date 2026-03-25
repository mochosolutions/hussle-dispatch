import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type Redis from 'ioredis';
import type { RequestHandler } from 'express';
import { createPlaceControllers } from './controllers/placeController';
import type { PlaceControllers } from './controllers/placeController';
import { createRouteDistanceController } from './controllers/routeDistanceController';
import { placeRepositoryPrisma } from './repositories/placeRepositoryPrisma';
import { placeStatsQueryPrisma } from './repositories/placeStatsQueryPrisma';
import { createPlaceService } from './services/placeService';
import { createAddressSearchService } from './services/addressSearchService';
import { createRouteDistanceService } from './services/routeDistanceService';
import { createAwsLocationProvider } from '@/shared/providers/awsLocationProvider';
import { calculateRoadDistance } from '@/shared/utils/distanceCalculator';
import { env } from '@/config/env';

interface PlaceModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  redis: Redis;
}

export interface PlaceModuleControllers extends PlaceControllers {
  routeDistance: RequestHandler;
}

export const createPlacesModule = ({
  prismaClient,
  redis,
}: PlaceModuleDeps): {
  controllers: PlaceModuleControllers;
} => {
  const repositories = placeRepositoryPrisma(prismaClient);

  const placeService = createPlaceService({
    placeRepository: repositories,
    redis,
  });

  const locationProvider = createAwsLocationProvider();

  const addressSearchService = createAddressSearchService({
    placeRepository: repositories,
    geocodingProvider: locationProvider,
  });

  const routeDistanceService = createRouteDistanceService({
    routingProvider: locationProvider,
    fallbackCalculator: { calculateRoadDistance },
    routeCalculatorEnabled: env.ROUTE_CALCULATOR_ENABLED,
  });

  const placeStatsQuery = placeStatsQueryPrisma(prismaClient);

  const placeControllers = createPlaceControllers({
    placeService,
    addressSearchService,
    placeStatsQuery,
  });

  const controllers: PlaceModuleControllers = {
    ...placeControllers,
    routeDistance: createRouteDistanceController({ routeDistanceService }),
  };

  return { controllers };
};
