import { prisma } from '@/shared/prisma';
import { createCarriersModule } from './compositionRoot';
import { createCarriersRouter } from './routes/carrierRoutes';

const carriersModule = createCarriersModule({
  prismaClient: prisma,
});

export const carriersRouter = createCarriersRouter(carriersModule.controllers);
