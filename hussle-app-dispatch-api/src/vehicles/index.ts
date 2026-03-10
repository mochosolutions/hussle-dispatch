import { prisma } from '@/shared/prisma';
import { createDriverQueryPort } from './repositories/driverQueryPortPrisma';
import { createVehiclesModule } from './compositionRoot';
import { createVehiclesRouter } from './routes/vehicleRoutes';

const driverQueryPort = createDriverQueryPort(prisma);

const vehiclesModule = createVehiclesModule({
  prismaClient: prisma,
  driverQueryPort,
});

export const vehiclesRouter = createVehiclesRouter(vehiclesModule.controllers);
