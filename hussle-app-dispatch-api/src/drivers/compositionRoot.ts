import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import { createLoadQueries } from '@/shared/loadQueries';
import { createDriverControllers } from './controllers/driverController';
import type { DriverControllers } from './controllers/driverController';
import { driverRepositoryPrisma } from './repositories/driverRepositoryPrisma';
import { createDriverService } from './services/driverService';

interface DriverModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
}

export const createDriversModule = ({
  prismaClient,
}: DriverModuleDeps): {
  controllers: DriverControllers;
} => {
  const repositories = driverRepositoryPrisma(prismaClient);
  const loadQueryPort = createLoadQueries(prismaClient);

  const driverService = createDriverService({
    driverRepository: repositories,
    carrierRepository: repositories,
    loadRepository: repositories,
    loadQueryPort,
  });

  const controllers = createDriverControllers({
    driverService,
  });

  return { controllers };
};
