import { prisma } from '@/shared/prisma';
import { logger } from '@/shared/utils/logger';
import { createApiKeysModule } from './compositionRoot';
import { apiKeyRoutes } from './routes/apiKeyRoutes';

const apiKeysModule = createApiKeysModule({ prismaClient: prisma, logger });

export const apiKeyRouter = apiKeyRoutes(apiKeysModule.controllers);
export const apiKeyService = apiKeysModule.service;
