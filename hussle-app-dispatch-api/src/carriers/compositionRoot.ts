import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import { createCarrierControllers } from './controllers/carrierController';
import type { CarrierControllers } from './controllers/carrierController';
import { carrierRepositoryPrisma } from './repositories/carrierRepositoryPrisma';
import { carrierStatsQueryPrisma } from './repositories/carrierStatsQueryPrisma';
import { createCarrierService } from './services/carrierService';
import { initializeCarrierSubscriber } from './services/carrierSubscriber';

interface CarrierModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  eventBus: EventBus;
  logger: Logger;
}

export const createCarriersModule = ({
  prismaClient,
  eventBus,
  logger,
}: CarrierModuleDeps): {
  controllers: CarrierControllers;
  initializeSubscriber: () => Promise<void>;
} => {
  const repositories = carrierRepositoryPrisma(prismaClient);
  const carrierStatsQuery = carrierStatsQueryPrisma(prismaClient);

  const carrierService = createCarrierService({
    carrierRepository: repositories,
    loadRepository: repositories,
    noteRepository: repositories,
  });

  const controllers = createCarrierControllers({
    carrierService,
    carrierStatsQuery,
  });

  const initializeSubscriber = () =>
    initializeCarrierSubscriber({
      eventBus,
      carrierRepo: repositories,
      logger,
    });

  return { controllers, initializeSubscriber };
};
