import type { PrismaClient } from '@prisma/client';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import type { BrowserPool } from '@/shared/providers/puppeteerBrowserPool';
import type { NotificationService } from '@/shared/notifications/notificationService';
import { settlementRepositoryPrisma } from './repositories/settlementRepositoryPrisma';
import { settlementLoadQueryPrisma } from './repositories/settlementLoadQueryPrisma';
import { settlementExpenseQueryPrisma } from './repositories/settlementExpenseQueryPrisma';
import { settlementCarrierQueryPrisma } from './repositories/settlementCarrierQueryPrisma';
import { settlementDriverQueryPrisma } from './repositories/settlementDriverQueryPrisma';
import { createSettlementService } from './services/settlementService';
import { createSettlementAdjustmentService } from './services/settlementAdjustmentService';
import { buildSettlementPdfData } from './services/settlementPdfDataBuilder';
import { createSettlementPdfGenerationService } from './services/settlementPdfGenerationService';
import { createSettlementEmailService } from './services/settlementEmailService';
import { createSettlementControllers } from './controllers/settlementController';
import { createAdjustmentControllers } from './controllers/adjustmentController';
import { initializeSettlementGeneratorSubscriber } from './services/settlementGeneratorSubscriber';
import type { SettlementModuleControllers } from './routes/settlementRoutes';

interface SettlementModuleDeps {
  prismaClient: PrismaClient;
  eventBus: EventBus;
  notificationService: NotificationService;
  fromEmail: string;
  browserPool: BrowserPool;
  logger: Logger;
}

export const createSettlementModule = ({
  prismaClient,
  eventBus,
  notificationService,
  fromEmail,
  browserPool,
  logger,
}: SettlementModuleDeps): {
  controllers: SettlementModuleControllers;
  initializeSubscriber: () => Promise<void>;
} => {
  // Repositories
  const settlementRepo = settlementRepositoryPrisma(prismaClient);
  const loadQuery = settlementLoadQueryPrisma(prismaClient);
  const expenseQuery = settlementExpenseQueryPrisma(prismaClient);
  const carrierQuery = settlementCarrierQueryPrisma(prismaClient);
  const driverQuery = settlementDriverQueryPrisma(prismaClient);

  // Services
  const settlementService = createSettlementService({
    settlementRepo,
    loadQuery,
    expenseQuery,
    carrierQuery,
    driverQuery,
    logger,
  });

  const adjustmentService = createSettlementAdjustmentService({
    settlementRepo,
    logger,
  });

  // PDF generation
  const pdfService = createSettlementPdfGenerationService({
    browserPool,
    logger,
  });

  // Email service
  const emailService = createSettlementEmailService({
    settlementRepo,
    pdfService,
    notificationService,
    fromEmail,
    logger,
  });

  // Controllers
  const controllers: SettlementModuleControllers = {
    settlement: createSettlementControllers({
      settlementService,
      sendSettlementEmail: (input) => emailService.sendSettlementEmail(input),
      buildPdfData: buildSettlementPdfData,
      pdfService,
    }),
    adjustment: createAdjustmentControllers({ adjustmentService }),
  };

  const initializeSubscriber = async (): Promise<void> => {
    await initializeSettlementGeneratorSubscriber({
      eventBus,
      generateSettlement: settlementService.generate,
      logger,
    });
  };

  return { controllers, initializeSubscriber };
};
