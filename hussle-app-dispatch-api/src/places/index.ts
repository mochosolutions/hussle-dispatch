import { prisma } from '@/shared/prisma';
import { redisClient } from '@/shared/redisClient';
import { createPlacesModule } from './compositionRoot';
import { createPlacesRouter } from './routes/placeRoutes';

const placesModule = createPlacesModule({
  prismaClient: prisma,
  redis: redisClient,
});

export const placesRouter = createPlacesRouter(placesModule.controllers);
