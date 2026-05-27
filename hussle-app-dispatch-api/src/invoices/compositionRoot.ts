import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import type { StorageProvider } from '@/shared/storage/storageProvider';
import type { BrowserPool } from '@/shared/providers/puppeteerBrowserPool';
import type { NotificationService } from '@/shared/notifications/notificationService';
import {
  invoiceRepositoryPrisma,
  invoiceLoadQueryPrisma,
} from './repositories/invoiceRepositoryPrisma';
import { orgSettingsQueryPrisma } from './repositories/orgSettingsQueryPrisma';
import { documentQueryPrisma } from './repositories/documentQueryPrisma';
import { createInvoiceService } from './services/invoiceService';
import { createInvoiceBuilderService } from './services/invoiceBuilderService';
import { createPdfGenerationService } from './services/pdfGenerationService';
import { createDocumentPacketService } from './services/documentPacketService';
import { createInvoiceEmailService } from './services/invoiceEmailService';
import { createInvoiceControllers } from './controllers/invoiceController';
import { createPdfControllers } from './controllers/pdfController';
import { createDocumentPacketControllers } from './controllers/documentPacketController';
import { createInvoiceBuilderControllers } from './controllers/invoiceBuilderController';
import { initializeCanceledLoadSubscriber } from './services/canceledLoadSubscriber';
import { initializeAccessorialSyncSubscriber } from './services/accessorialSyncSubscriber';
import { initializeReadinessSubscriber } from './services/invoiceReadinessSubscriber';
import { initializeInvoicePdfGenerationSubscriber } from './services/invoicePdfGenerationSubscriber';
import type { InvoiceControllers } from './controllers/invoiceController';
import type { PdfControllers } from './controllers/pdfController';
import type { DocumentPacketControllers } from './controllers/documentPacketController';
import type { InvoiceBuilderControllers } from './controllers/invoiceBuilderController';

interface InvoiceModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  eventBus: EventBus;
  notificationService: NotificationService;
  storageProvider: StorageProvider;
  browserPool: BrowserPool;
  logger: Logger;
}

export interface InvoiceModuleControllers {
  invoice: InvoiceControllers;
  pdf: PdfControllers;
  packet: DocumentPacketControllers;
  builder: InvoiceBuilderControllers;
}

export const createInvoiceModule = ({
  prismaClient,
  eventBus,
  notificationService,
  storageProvider,
  browserPool,
  logger,
}: InvoiceModuleDeps): {
  controllers: InvoiceModuleControllers;
  initializeSubscriber: () => Promise<void>;
} => {
  const invoiceRepo = invoiceRepositoryPrisma(prismaClient);
  const loadQuery = invoiceLoadQueryPrisma(prismaClient);
  const orgSettingsQuery = orgSettingsQueryPrisma(prismaClient);
  const documentQuery = documentQueryPrisma(prismaClient);

  // PDF generation
  const pdfService = createPdfGenerationService({
    browserPool,
    logger,
  });

  // Email service — orchestrates PDF + doc collection, delegates send to notificationService
  const invoiceEmailService = createInvoiceEmailService({
    invoiceRepo,
    loadQuery,
    orgSettingsQuery,
    documentQuery,
    pdfService,
    storageProvider,
    notificationService,
    logger,
  });

  // Core invoice service
  const invoiceService = createInvoiceService({
    invoiceRepo,
    loadQuery,
    invoiceEmailService,
    logger,
  });

  // Invoice builder
  const invoiceBuilderService = createInvoiceBuilderService({
    invoiceRepo,
    loadQuery,
    eventBus,
    logger,
  });

  // Document packet
  const documentPacketService = createDocumentPacketService({
    invoiceRepo,
    loadQuery,
    orgSettingsQuery,
    documentQuery,
    pdfService,
    storageProvider,
    logger,
  });

  // Controllers
  const controllers: InvoiceModuleControllers = {
    invoice: createInvoiceControllers({ invoiceService }),
    pdf: createPdfControllers({
      invoiceRepo,
      loadQuery,
      orgSettingsQuery,
      pdfService,
      storageProvider,
      logger,
    }),
    packet: createDocumentPacketControllers({
      documentPacketService,
      invoiceRepo,
    }),
    builder: createInvoiceBuilderControllers({
      invoiceBuilderService,
    }),
  };

  const initializeSubscriber = async () => {
    await initializeCanceledLoadSubscriber({
      eventBus,
      invoiceRepo,
      logger,
    });
    await initializeAccessorialSyncSubscriber({
      eventBus,
      invoiceRepo,
      loadQuery,
      logger,
    });
    await initializeReadinessSubscriber({
      eventBus,
      invoiceRepo,
      loadQuery,
      documentQuery,
      orgSettingsQuery,
      invoiceBuilderService,
      invoiceEmailService,
      logger,
    });
    await initializeInvoicePdfGenerationSubscriber({
      eventBus,
      invoiceRepo,
      loadQuery,
      orgSettingsQuery,
      pdfService,
      storageProvider,
      logger,
    });
  };

  return { controllers, initializeSubscriber };
};
