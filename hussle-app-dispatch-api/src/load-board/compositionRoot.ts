import type Redis from 'ioredis';
import type { PrismaClient } from '@prisma/client';
import type { Logger } from '../shared/utils/logger';
import { createLoadBoardRedisAdapter } from './adapters/loadBoardRedisAdapter';
import { createLoadBoardService } from './services/loadBoardService';
import { createLoadBoardControllers } from './controllers/loadBoardControllers';
import type { LoadBoardControllers } from './controllers/loadBoardControllers';

interface LoadBoardModuleDeps {
  redis: Redis;
  logger: Logger;
  prisma: PrismaClient;
}

interface LoadBoardModule {
  controllers: LoadBoardControllers;
}

export const createLoadBoardModule = (deps: LoadBoardModuleDeps): LoadBoardModule => {
  const redisPort = createLoadBoardRedisAdapter(deps.redis);
  const service = createLoadBoardService({ redisPort, logger: deps.logger });
  const controllers = createLoadBoardControllers({ service, prisma: deps.prisma });
  return { controllers };
};
