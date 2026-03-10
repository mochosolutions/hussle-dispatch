import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import {
  invoiceRepositoryPrisma,
  invoiceLoadQueryPrisma,
} from './repositories/invoiceRepositoryPrisma';
import { createInvoiceService } from './services/invoiceService';
import { createInvoiceControllers } from './controllers/invoiceController';
import { initializeInvoiceSubscriber } from './services/invoiceSubscriber';
import type { InvoiceControllers } from './controllers/invoiceController';

interface NotificationPort {
  sendEmail(params: {
    to: string;
    from: string;
    subject: string;
    html: string;
    attachments?: { filename: string; content: string }[];
  }): Promise<void>;
}

interface InvoiceModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  eventBus: EventBus;
  notificationService: NotificationPort;
  logger: Logger;
}

export const createInvoiceModule = ({
  prismaClient,
  eventBus,
  notificationService,
  logger,
}: InvoiceModuleDeps): {
  controllers: InvoiceControllers;
  initializeSubscriber: () => Promise<void>;
} => {
  const invoiceRepo = invoiceRepositoryPrisma(prismaClient);
  const loadQuery = invoiceLoadQueryPrisma(prismaClient);

  const invoiceService = createInvoiceService({
    invoiceRepo,
    loadQuery,
    notificationService,
    logger,
  });

  const controllers = createInvoiceControllers({
    invoiceService,
  });

  const initializeSubscriber = () =>
    initializeInvoiceSubscriber({
      eventBus,
      invoiceRepo,
      loadQuery,
      logger,
    });

  return { controllers, initializeSubscriber };
};
