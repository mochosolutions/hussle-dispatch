import { prisma } from '@/shared/prisma';
import { createInMemoryEventBus } from '@/shared/messaging';
import { logger } from '@/shared/utils/logger';
import { createNotificationService } from '@/shared/notifications';
import { createInvoiceModule } from './compositionRoot';
import { createInvoiceRouter } from './routes/invoiceRoutes';

// TODO: Replace with shared eventBus instance when module wiring is centralized
const eventBus = createInMemoryEventBus();

const notificationService = createNotificationService({ backend: 'console' }, logger);

const invoiceModule = createInvoiceModule({
  prismaClient: prisma,
  eventBus,
  notificationService,
  logger,
});

// Initialize subscriber for auto-generation
invoiceModule.initializeSubscriber().catch((error: unknown) => {
  logger.error('Failed to initialize invoice subscriber', {
    error: error instanceof Error ? error.message : String(error),
  });
});

export const invoicesRouter = createInvoiceRouter(invoiceModule.controllers);
