import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';
import type { InvoiceRepoPort } from '../types/invoiceTypes';

interface CanceledLoadSubscriberDeps {
  eventBus: EventBus;
  invoiceRepo: InvoiceRepoPort;
  logger: Logger;
}

const VOIDABLE_STATUSES = new Set(['DRAFT', 'APPROVED']);

/**
 * Subscribes to the 'load.canceled' event to void any DRAFT or APPROVED
 * invoices associated with the canceled load.
 */
export const initializeCanceledLoadSubscriber = async (
  deps: CanceledLoadSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe('load.canceled', 'invoices-service', async (data) => {
    try {
      const invoices = await deps.invoiceRepo.findManyByLoadId(data.loadId);
      const voidable = invoices.filter((inv) => VOIDABLE_STATUSES.has(inv.status));

      if (voidable.length === 0) {
        deps.logger.info('No voidable invoices found for canceled load', {
          loadId: data.loadId,
        });
        return;
      }

      await Promise.all(
        voidable.map((inv) => deps.invoiceRepo.updateStatus(inv.id, 'VOID')),
      );

      deps.logger.info('Voided invoices for canceled load', {
        loadId: data.loadId,
        voidedCount: voidable.length,
        voidedInvoiceIds: voidable.map((inv) => inv.id),
      });
    } catch (error: unknown) {
      deps.logger.error('Failed to void invoices for canceled load', {
        loadId: data.loadId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  deps.logger.info('Canceled load subscriber initialized');
};
