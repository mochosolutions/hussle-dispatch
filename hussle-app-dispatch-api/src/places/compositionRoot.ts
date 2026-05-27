import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type Redis from 'ioredis';
import type { RequestHandler } from 'express';
import { createPlaceControllers } from './controllers/placeController';
import type { PlaceControllers } from './controllers/placeController';
import { createRouteDistanceController } from './controllers/routeDistanceController';
import { placeRepositoryPrisma } from './repositories/placeRepositoryPrisma';
import { placeStatsQueryPrisma } from './repositories/placeStatsQueryPrisma';
import { organizationQueryPrisma } from './repositories/organizationQueryPrisma';
import { createPlaceService } from './services/placeService';
import { createAddressSearchService } from './services/addressSearchService';
import type { AddressSearchInput, AddressSearchResult } from './types/addressSearchTypes';
import { createRouteDistanceService } from './services/routeDistanceService';
import { checkFacilityOpenAt } from './services/facilityHoursService';
import type { CheckFacilityOpenAtInput } from './services/facilityHoursService';
import { createResolveStopToPlace } from './services/resolveStopToPlace';
import type { ResolveStopInput, ResolveStopResult } from './services/resolveStopToPlace';
import { logger } from '@/shared/utils/logger';
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

export interface PlaceModuleQueries {
  checkFacilityOpenAt: (input: CheckFacilityOpenAtInput) => ReturnType<typeof checkFacilityOpenAt>;
}

export interface PlaceModuleServices {
  resolveStopToPlace: (
    stop: ResolveStopInput,
    organizationId: string,
  ) => Promise<ResolveStopResult>;
  addressSearchService: {
    search(input: AddressSearchInput): Promise<AddressSearchResult[]>;
  };
}

export const createPlacesModule = ({
  prismaClient,
  redis,
}: PlaceModuleDeps): {
  controllers: PlaceModuleControllers;
  queries: PlaceModuleQueries;
  services: PlaceModuleServices;
} => {
  const repositories = placeRepositoryPrisma(prismaClient);

  const placeService = createPlaceService({
    placeRepository: repositories,
    redis,
  });

  const locationProvider = createAwsLocationProvider();

  const organizationQueries = organizationQueryPrisma(prismaClient);

  const addressSearchService = createAddressSearchService({
    placeRepository: repositories,
    geocodingProvider: locationProvider,
    organizationQueries,
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

  const facilityHoursDeps = { placeRepo: repositories, logger };

  const queries: PlaceModuleQueries = {
    checkFacilityOpenAt: (input) => checkFacilityOpenAt(input, facilityHoursDeps),
  };

  const resolveStopToPlace = createResolveStopToPlace({
    placeRepo: repositories,
    geocodingProvider: locationProvider,
    logger,
  });

  const services: PlaceModuleServices = {
    resolveStopToPlace,
    addressSearchService,
  };

  return { controllers, queries, services };
};
