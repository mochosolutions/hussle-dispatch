import { prisma } from '@/shared/prisma';
import { redisClient } from '@/shared/redisClient';
import { createPlacesModule } from './compositionRoot';
import { createPlacesRouter } from './routes/placeRoutes';

const placesModule = createPlacesModule({
  prismaClient: prisma,
  redis: redisClient,
});

export const placesRouter = createPlacesRouter(placesModule.controllers);
export const placeQueries = placesModule.queries;
export const placeServices = placesModule.services;
export { createResolveStopToPlace } from './services/resolveStopToPlace';
export type {
  ResolveStopInput,
  ResolveStopResult,
  Warning,
  WarningCodeValue,
  StopResolutionStatusValue,
} from './services/resolveStopToPlace';
export {
  StopResolutionStatus,
  WarningCode,
} from './services/resolveStopToPlace';
