// Re-exports
export { createLoadBoardModule } from './compositionRoot';
export { loadBoardRoutes } from './routes/loadBoardRoutes';
export type { LoadBoardRedisPort } from './types/loadBoardPorts';
export type { StagedLoad, LoadSource, FeedResponse } from './types/loadBoardTypes';

// Wired router for mounting in app.ts
import { redisClient } from '@/shared/redisClient';
import { logger } from '@/shared/utils/logger';
import { createLoadBoardModule } from './compositionRoot';
import { loadBoardRoutes } from './routes/loadBoardRoutes';

const loadBoardModule = createLoadBoardModule({
  redis: redisClient,
  logger,
});

export const loadBoardRouter = loadBoardRoutes(loadBoardModule.controllers);
