import { prisma } from '@/shared/prisma';
import { createDriversModule } from './compositionRoot';
import { createDriversRouter } from './routes/driverRoutes';

const driversModule = createDriversModule({
  prismaClient: prisma,
});

export const driversRouter = createDriversRouter(driversModule.controllers);
