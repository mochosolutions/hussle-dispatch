import { prisma } from '@/shared/prisma';
import { redisClient } from '@/shared/redisClient';
import { sharedEventBus } from '@/shared/messaging/sharedEventBus';
import { logger } from '@/shared/utils/logger';
import { ROLES } from '@/config/roles';
import { AUTH_ENUM_CONFIG } from '@/config/authEnumConfig';
import { createAuthModule } from './compositionRoot';
import { createRootAuthRouter } from './routes';
import { auditLogRepositoryPrisma } from '../audit/repositories/auditLogRepositoryPrisma';

const auditLogRepo = {
  create: (organizationId: string, input: Parameters<ReturnType<typeof auditLogRepositoryPrisma>['create']>[0]) => {
    const scopedRepo = auditLogRepositoryPrisma(prisma, organizationId);
    return scopedRepo.create(input);
  },
};

const authModule = createAuthModule({
  prismaClient: prisma,
  redisClient,
  config: {
    allowedRoles: [ROLES.ADMIN, ROLES.DISPATCHER, ROLES.VIEWER, ROLES.DRIVER],
    defaultOrgRole: AUTH_ENUM_CONFIG.organizationRole.default ?? 'CARRIER',
  },
  enumConfig: AUTH_ENUM_CONFIG,
  eventBus: sharedEventBus,
  logger,
  auditLogRepo,
});

export const rootAuthRouter = createRootAuthRouter(
  authModule.controllers,
  authModule.validators,
);
