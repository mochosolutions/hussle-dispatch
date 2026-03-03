import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import { createCarrierControllers } from './controllers/carrierController';
import type { CarrierControllers } from './controllers/carrierController';
import { carrierRepositoryPrisma } from './repositories/carrierRepositoryPrisma';
import { createCarrierService } from './services/carrierService';

interface CarrierModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
}

export const createCarriersModule = ({
  prismaClient,
}: CarrierModuleDeps): {
  controllers: CarrierControllers;
} => {
  const repositories = carrierRepositoryPrisma(prismaClient);

  const carrierService = createCarrierService({
    carrierRepository: repositories,
    loadRepository: repositories,
  });

  const controllers = createCarrierControllers({
    carrierService,
  });

  return { controllers };
};
