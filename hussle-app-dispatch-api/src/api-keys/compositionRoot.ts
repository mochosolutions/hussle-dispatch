import type { PrismaClient } from '@prisma/client';
import type { Logger } from '@/shared/utils/logger';
import { createApiKeyControllers } from './controllers/apiKeyControllers';
import type { ApiKeyControllers } from './controllers/apiKeyControllers';
import { apiKeyRepositoryPrisma } from './repositories/apiKeyRepositoryPrisma';
import { createApiKeyService } from './services/apiKeyService';
import type { ApiKeyService } from './services/apiKeyService';

interface ApiKeysModuleDeps {
  prismaClient: PrismaClient;
  logger: Logger;
}

interface ApiKeysModule {
  controllers: ApiKeyControllers;
  service: ApiKeyService;
}

export const createApiKeysModule = (deps: ApiKeysModuleDeps): ApiKeysModule => {
  const apiKeyRepo = apiKeyRepositoryPrisma(deps.prismaClient);
  const service = createApiKeyService({ apiKeyRepo, logger: deps.logger });
  const controllers = createApiKeyControllers({ service });
  return { controllers, service };
};
