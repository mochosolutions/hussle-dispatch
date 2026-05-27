import { prisma } from '@/shared/prisma';
import { logger } from '@/shared/utils/logger';
import { createShortLinksModule } from './compositionRoot';
import { createShortLinkRoutes } from './routes/shortLinkRoutes';

const shortLinksModule = createShortLinksModule({
  prismaClient: prisma,
  logger,
});

export const shortLinkService = shortLinksModule.shortLinkService;
export const shortLinksRouter = createShortLinkRoutes(
  shortLinksModule.controllers,
);
