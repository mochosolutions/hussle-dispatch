import { prisma } from '@/shared/prisma';
import { redisClient } from '@/shared/redisClient';
import { ROLES } from '@/config/roles';
import { createAuthModule } from './compositionRoot';
import { createRootAuthRouter } from './routes';

const authModule = createAuthModule({
  prismaClient: prisma,
  redisClient,
  config: {
    allowedRoles: [ROLES.ADMIN, ROLES.DISPATCHER, ROLES.VIEWER, ROLES.DRIVER],
    defaultOrgRole: 'carrier',
  },
});

export const rootAuthRouter = createRootAuthRouter(authModule.controllers);
