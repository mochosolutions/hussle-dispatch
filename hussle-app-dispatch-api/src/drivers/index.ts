import { prisma } from '@/shared/prisma';
import { redisClient } from '@/shared/redisClient';
import { createDriversModule } from './compositionRoot';
import { createDriversRouter } from './routes/driverRoutes';

const driversModule = createDriversModule({
  prismaClient: prisma,
  redis: redisClient,
});

export const driversRouter = createDriversRouter(driversModule.controllers);
export const driverQueries = driversModule.queries;
