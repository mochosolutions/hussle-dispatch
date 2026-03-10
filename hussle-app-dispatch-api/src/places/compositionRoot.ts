import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type Redis from 'ioredis';
import { createPlaceControllers } from './controllers/placeController';
import type { PlaceControllers } from './controllers/placeController';
import { placeRepositoryPrisma } from './repositories/placeRepositoryPrisma';
import { createPlaceService } from './services/placeService';

interface PlaceModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  redis: Redis;
}

export const createPlacesModule = ({
  prismaClient,
  redis,
}: PlaceModuleDeps): {
  controllers: PlaceControllers;
} => {
  const repositories = placeRepositoryPrisma(prismaClient);

  const placeService = createPlaceService({
    placeRepository: repositories,
    redis,
  });

  const controllers = createPlaceControllers({
    placeService,
  });

  return { controllers };
};
