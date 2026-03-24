import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';
import type { InvoiceRepoPort, InvoiceLoadQueryPort } from '../types/invoiceTypes';
import { generateFromDelivery, generateTonuInvoice } from './invoiceGenerationService';

interface InvoiceSubscriberDeps {
  eventBus: EventBus;
  invoiceRepo: InvoiceRepoPort;
  loadQuery: InvoiceLoadQueryPort;
  logger: Logger;
}

/**
 * Subscribes to domain events on the EventBus to auto-generate invoices.
 * - 'load.delivered' → generateFromDelivery
 * - 'load.tonu' → generateTonuInvoice
 */
export const initializeInvoiceSubscriber = async (
  deps: InvoiceSubscriberDeps,
): Promise<void> => {
  const generationDeps = {
    invoiceRepo: deps.invoiceRepo,
    loadQuery: deps.loadQuery,
    logger: deps.logger,
  };

  await deps.eventBus.subscribe('load.delivered', 'invoices-service', async (data) => {
    try {
      await generateFromDelivery(data.loadId, generationDeps);
    } catch (error: unknown) {
      deps.logger.error('Failed to generate invoice from delivery event', {
        loadId: data.loadId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await deps.eventBus.subscribe('load.tonu', 'invoices-service', async (data) => {
    try {
      await generateTonuInvoice(data.loadId, generationDeps);
    } catch (error: unknown) {
      deps.logger.error('Failed to generate TONU invoice from event', {
        loadId: data.loadId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  deps.logger.info('Invoice subscriber initialized');
};
