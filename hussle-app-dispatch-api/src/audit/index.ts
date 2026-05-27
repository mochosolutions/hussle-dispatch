import { prisma } from '@/shared/prisma';
import { sharedEventBus } from '@/shared/messaging';
import { logger } from '@/shared/utils/logger';
import { createAuditModule } from './compositionRoot';

const auditModule = createAuditModule({
  prismaClient: prisma,
  eventBus: sharedEventBus,
  logger,
});

// Initialize subscriber for audit log events
auditModule.initializeSubscriber().catch((error: unknown) => {
  logger.error('Failed to initialize audit subscriber', {
    error: error instanceof Error ? error.message : String(error),
  });
});
