import { prisma } from '@/shared/prisma';
import { redisClient } from '@/shared/redisClient';
import { logger } from '@/shared/utils/logger';
import { createDriversModule } from './compositionRoot';
import { createDriversRouter } from './routes/driverRoutes';

const driversModule = createDriversModule({
  prismaClient: prisma,
  redis: redisClient,
  logger,
});

export const driversRouter = createDriversRouter(driversModule.controllers);
export const driverQueries = driversModule.queries;
