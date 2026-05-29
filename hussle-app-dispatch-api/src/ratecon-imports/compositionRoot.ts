import type { PrismaClient } from '@prisma/client';

import type { EventBus } from '@/shared/messaging/eventBus';
import type { PythonServiceClient } from '@/shared/python/pythonServiceClient';
import type { StorageProvider } from '@/shared/storage/storageProvider';
import type { Logger } from '@/shared/utils/logger';

import type { MailpitClient } from './adapters/mailpitClient';
import {
  createRateconImportControllers,
  type RateconImportControllers,
} from './controllers/rateconImportController';
import {
  createRateconWebhookControllers,
  type RateconWebhookControllers,
} from './controllers/rateconWebhookController';
import { createRateconExtractionSubscriber } from './events/handlers/rateconExtractionHandler';
import { rateconImportRepositoryPrisma } from './repositories/rateconImportRepositoryPrisma';
import { createInboundEmailIngestor } from './services/inboundEmailService';
import {
  createRateconImportService,
  type RateconImportService,
} from './services/rateconImportService';
import type {
  RateconCustomerLookupPort,
  RateconDocumentPort,
} from './types/rateconImportTypes';

export interface RateconImportsModuleDeps {
  prismaClient: PrismaClient;
  storageProvider: StorageProvider;
  eventBus: EventBus;
  pythonClient: PythonServiceClient;
  documentPort: RateconDocumentPort;
  customerLookup: RateconCustomerLookupPort;
  webhookSecret: string;
  logger: Logger;
  mailpitClient?: MailpitClient;
}

export interface RateconImportsModule {
  rateconImportService: RateconImportService;
  controllers: RateconImportControllers;
  webhookControllers: RateconWebhookControllers;
  mailpitEnabled: boolean;
  initializeSubscriber: () => Promise<void>;
}

export const createRateconImportsModule = (
  deps: RateconImportsModuleDeps,
): RateconImportsModule => {
  const rateconImportRepo = rateconImportRepositoryPrisma(deps.prismaClient);

  const rateconImportService = createRateconImportService({
    rateconImportRepo,
    documentPort: deps.documentPort,
    storageProvider: deps.storageProvider,
    eventBus: deps.eventBus,
    logger: deps.logger,
  });

  const ingestor = createInboundEmailIngestor({
    rateconImportService,
    rateconImportRepo,
    logger: deps.logger,
  });

  const controllers = createRateconImportControllers({ rateconImportService });

  const webhookControllers = createRateconWebhookControllers({
    ingestor,
    webhookSecret: deps.webhookSecret,
    logger: deps.logger,
    ...(deps.mailpitClient !== undefined && { mailpitClient: deps.mailpitClient }),
  });

  const initializeSubscriber = () =>
    createRateconExtractionSubscriber({
      rateconImportRepo,
      documentPort: deps.documentPort,
      customerLookup: deps.customerLookup,
      storageProvider: deps.storageProvider,
      pythonClient: deps.pythonClient,
      eventBus: deps.eventBus,
      logger: deps.logger,
    });

  return {
    rateconImportService,
    controllers,
    webhookControllers,
    mailpitEnabled: deps.mailpitClient !== undefined,
    initializeSubscriber,
  };
};
