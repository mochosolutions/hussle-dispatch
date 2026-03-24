import type { PrismaClient } from '@prisma/client';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import type { CreateAuditLogInput } from './types/auditTypes';
import { auditLogRepositoryPrisma } from './repositories/auditLogRepositoryPrisma';
import { initializeAuditSubscriber } from './services/auditSubscriber';

interface AuditModuleDeps {
  prismaClient: PrismaClient;
  eventBus: EventBus;
  logger: Logger;
}

export const createAuditModule = ({
  prismaClient,
  eventBus,
  logger,
}: AuditModuleDeps): {
  initializeSubscriber: () => Promise<void>;
} => {
  // The subscriber receives organizationId per-event, so we create
  // a scoped repository instance for each call.
  const auditLogRepo = {
    create: (organizationId: string, input: CreateAuditLogInput) => {
      const scopedRepo = auditLogRepositoryPrisma(prismaClient, organizationId);
      return scopedRepo.create(input);
    },
  };

  const initializeSubscriber = () =>
    initializeAuditSubscriber({
      eventBus,
      auditLogRepo,
      logger,
    });

  return { initializeSubscriber };
};
