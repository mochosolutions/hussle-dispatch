import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import { PrismaTransactionManager } from '@/shared/prisma';
import { createVehicleControllers } from './controllers/vehicleController';
import type { VehicleControllers } from './controllers/vehicleController';
import { vehicleRepositoryPrisma } from './repositories/vehicleRepositoryPrisma';
import { createVehicleService } from './services/vehicleService';

interface VehicleModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
}

export const createVehiclesModule = ({
  prismaClient,
}: VehicleModuleDeps): {
  controllers: VehicleControllers;
} => {
  const repositories = vehicleRepositoryPrisma(prismaClient);
  const transactionManager = new PrismaTransactionManager();

  const vehicleService = createVehicleService({
    vehicleRepository: repositories,
    carrierRepository: repositories,
    loadRepository: repositories,
    transactionManager,
    vehicleRepositoryFactory: (tx) => vehicleRepositoryPrisma(tx),
  });

  const controllers = createVehicleControllers({
    vehicleService,
  });

  return { controllers };
};
