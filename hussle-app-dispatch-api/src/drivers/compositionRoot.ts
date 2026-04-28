import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import type { PrismaTransaction } from '@/config/database';
import { getCityCoords } from '@/shared/geoLookup';
import type { Logger } from '@/shared/utils/logger';
import type { EligibleDriverQueryPort } from '@/loads/types/rankDriverTypes';
import type { DriverAvailabilityWindow } from './types/driverAvailabilityTypes';
import { createLoadQueries } from '@/shared/loadQueries';
import { createDriverAvailabilityControllers } from './controllers/driverAvailabilityController';
import { createDriverControllers } from './controllers/driverController';
import { driverAvailabilityRepositoryPrisma } from './repositories/driverAvailabilityRepositoryPrisma';
import { driverRepositoryPrisma } from './repositories/driverRepositoryPrisma';
import { eligibleDriverQueryPrisma } from './repositories/eligibleDriverQueryPrisma';
import { calculateDeadheadTo } from './services/deadheadToService';
import { createDriverService } from './services/driverService';
import * as availabilityService from './services/driverAvailabilityService';
import type { DriverRouterControllers } from './routes/driverRoutes';

interface DriverModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  redis: Redis;
  logger: Logger;
}

export interface DriverModuleQueries extends EligibleDriverQueryPort {
  checkAvailabilityAt: (input: {
    driverId: string;
    organizationId: string;
    atUtc: Date;
  }) => Promise<DriverAvailabilityWindow>;
}

export const createDriversModule = ({
  prismaClient,
  redis,
  logger,
}: DriverModuleDeps): {
  controllers: DriverRouterControllers;
  queries: DriverModuleQueries;
} => {
  const repositories = driverRepositoryPrisma(prismaClient);
  const loadQueryPort = createLoadQueries(prismaClient);
  const availabilityRepo = driverAvailabilityRepositoryPrisma(prismaClient);
  const eligibleDriverQuery = eligibleDriverQueryPrisma(prismaClient);

  const driverService = createDriverService({
    driverRepository: repositories,
    carrierRepository: repositories,
    loadRepository: repositories,
    loadQueryPort,
    redis,
    getCityCoords,
    logger,
  });

  const availabilityDeps = {
    availabilityRepo,
    driverRepo: repositories,
  };

  const deadheadToServiceDeps = {
    findDriver: repositories.findById,
    getCityCoords,
    redis,
  };

  const controllers = createDriverControllers({
    driverService,
    deadheadToService: (input) => calculateDeadheadTo(input, deadheadToServiceDeps),
  });

  const availabilityControllers = createDriverAvailabilityControllers({
    setWeeklySchedule: (input) => availabilityService.setWeeklySchedule(input, availabilityDeps),
    getWeeklySchedule: (input) => availabilityService.getWeeklySchedule(input, availabilityDeps),
    createOverride: (input) => availabilityService.createOverride(input, availabilityDeps),
    listOverrides: (input) => availabilityService.listOverrides(input, availabilityDeps),
    deleteOverride: (input) => availabilityService.deleteOverride(input, availabilityDeps),
  });

  const queries: DriverModuleQueries = {
    findActiveDriversForOrg: eligibleDriverQuery.findActiveDriversForOrg,
    checkAvailabilityAt: (input) =>
      availabilityService.checkAvailabilityAt(input, availabilityDeps),
  };

  return {
    controllers: {
      ...controllers,
      availability: availabilityControllers,
    },
    queries,
  };
};
