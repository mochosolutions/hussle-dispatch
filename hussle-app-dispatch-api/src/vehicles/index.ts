import { prisma } from '@/shared/prisma';
import { createVehiclesModule } from './compositionRoot';
import { createVehiclesRouter } from './routes/vehicleRoutes';

const vehiclesModule = createVehiclesModule({
  prismaClient: prisma,
});

export const vehiclesRouter = createVehiclesRouter(vehiclesModule.controllers);
