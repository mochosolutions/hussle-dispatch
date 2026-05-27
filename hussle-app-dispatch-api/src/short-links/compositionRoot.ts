import type { PrismaClient } from '@prisma/client';
import type { Logger } from '@/shared/utils/logger';
import { shortLinkRepositoryPrisma } from './repositories/shortLinkRepositoryPrisma';
import {
  createShortLinkService,
  type ShortLinkService,
} from './services/shortLinkService';
import { createResolveSlugController } from './controllers/resolveSlugController';
import type { ShortLinkControllers } from './routes/shortLinkRoutes';

interface ShortLinksModuleDeps {
  prismaClient: PrismaClient;
  logger: Logger;
}

export interface ShortLinksModuleExports {
  controllers: ShortLinkControllers;
  shortLinkService: ShortLinkService;
}

export const createShortLinksModule = (
  deps: ShortLinksModuleDeps,
): ShortLinksModuleExports => {
  const repo = shortLinkRepositoryPrisma(deps.prismaClient);

  const shortLinkService = createShortLinkService({
    repo,
    logger: deps.logger,
  });

  const controllers: ShortLinkControllers = {
    resolveSlug: createResolveSlugController({
      shortLinkService,
      logger: deps.logger,
    }),
  };

  return { controllers, shortLinkService };
};
