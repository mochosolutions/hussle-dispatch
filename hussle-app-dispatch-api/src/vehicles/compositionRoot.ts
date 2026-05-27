import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { EventBus } from '@/shared/messaging';
import { createLoadQueries } from '@/shared/loadQueries';
import { PrismaTransactionManager } from '@/shared/prisma';
import { createVehicleControllers } from './controllers/vehicleController';
import type { VehicleControllers } from './controllers/vehicleController';
import { createCarrierQueryPort } from './repositories/carrierQueryPortPrisma';
import { createLoadQueryPort } from './repositories/loadQueryPortPrisma';
import { vehicleRepositoryPrisma } from './repositories/vehicleRepositoryPrisma';
import { createVehicleService } from './services/vehicleService';
import type { DriverQueryPort } from './types/vehicleTypes';

interface VehicleModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  driverQueryPort: DriverQueryPort;
  eventBus: EventBus;
}

export const createVehiclesModule = ({
  prismaClient,
  driverQueryPort,
  eventBus,
}: VehicleModuleDeps): {
  controllers: VehicleControllers;
} => {
  const vehicleRepository = vehicleRepositoryPrisma(prismaClient);
  const carrierRepository = createCarrierQueryPort(prismaClient);
  const loadRepository = createLoadQueryPort(prismaClient);
  const transactionManager = new PrismaTransactionManager();
  const loadQueryPort = createLoadQueries(prismaClient);

  const vehicleService = createVehicleService({
    vehicleRepository,
    carrierRepository,
    loadRepository,
    driverQueryPort,
    loadQueryPort,
    eventBus,
    transactionManager,
    vehicleRepositoryFactory: (tx) => vehicleRepositoryPrisma(tx),
  });

  const controllers = createVehicleControllers({
    vehicleService,
  });

  return { controllers };
};
