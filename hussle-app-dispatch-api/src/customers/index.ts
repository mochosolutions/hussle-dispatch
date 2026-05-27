import { prisma } from '@/shared/prisma';
import { createCustomersModule } from './compositionRoot';
import { createCustomersRouter } from './routes/customerRoutes';

const customersModule = createCustomersModule({
  prismaClient: prisma,
});

export const customersRouter = createCustomersRouter(customersModule.controllers);
