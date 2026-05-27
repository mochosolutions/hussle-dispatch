import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';
import type { InvoiceRepoPort, InvoiceLoadQueryPort } from '../types/invoiceTypes';

interface AccessorialSyncSubscriberDeps {
  eventBus: EventBus;
  invoiceRepo: InvoiceRepoPort;
  loadQuery: InvoiceLoadQueryPort;
  logger: Logger;
}

const NON_MODIFIABLE_STATUSES = new Set(['APPROVED', 'SENT', 'PAID']);

const sumAccessorials = (charges: { amount: unknown }[]): number =>
  charges.reduce((total, charge) => {
    const amount = typeof charge.amount === 'number'
      ? charge.amount
      : Number(charge.amount);
    return total + amount;
  }, 0);

/**
 * Recalculates the accessorial total and totalAmount on a DRAFT invoice
 * whenever an accessorial charge is created, updated, or deleted.
 */
const syncInvoiceAccessorials = async (
  loadId: string,
  deps: Omit<AccessorialSyncSubscriberDeps, 'eventBus'>,
): Promise<void> => {
  const load = await deps.loadQuery.findLoadById(loadId);

  if (!load) {
    deps.logger.warn('Load not found when syncing accessorials', { loadId });
    return;
  }

  const invoice = await deps.invoiceRepo.findByLoadId(loadId, load.organizationId);

  if (!invoice) {
    deps.logger.info('No invoice found for load — skipping accessorial sync', { loadId });
    return;
  }

  if (NON_MODIFIABLE_STATUSES.has(invoice.status)) {
    deps.logger.warn('Invoice is not in DRAFT status — skipping accessorial sync', {
      loadId,
      invoiceId: invoice.id,
      invoiceStatus: invoice.status,
    });
    return;
  }

  const accessorialsTotal = sumAccessorials(load.accessorialCharges);
  const subtotal = typeof invoice.subtotal === 'number'
    ? invoice.subtotal
    : Number(invoice.subtotal);
  const totalAmount = subtotal + accessorialsTotal;

  await deps.invoiceRepo.update(invoice.id, load.organizationId, {
    accessorials: accessorialsTotal,
    totalAmount,
  });

  deps.logger.info('Invoice accessorials synced', {
    loadId,
    invoiceId: invoice.id,
    accessorials: accessorialsTotal,
    totalAmount,
  });
};

/**
 * Subscribes to accessorial.created, accessorial.updated, and accessorial.deleted
 * events to keep DRAFT invoices in sync with accessorial charge totals.
 */
export const initializeAccessorialSyncSubscriber = async (
  deps: AccessorialSyncSubscriberDeps,
): Promise<void> => {
  const handlerDeps = {
    invoiceRepo: deps.invoiceRepo,
    loadQuery: deps.loadQuery,
    logger: deps.logger,
  };

  await deps.eventBus.subscribe('accessorial.created', 'invoices-service', async (data) => {
    try {
      await syncInvoiceAccessorials(data.loadId, handlerDeps);
    } catch (error: unknown) {
      deps.logger.error('Failed to sync invoice on accessorial.created', {
        loadId: data.loadId,
        accessorialId: data.accessorialId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await deps.eventBus.subscribe('accessorial.updated', 'invoices-service', async (data) => {
    try {
      await syncInvoiceAccessorials(data.loadId, handlerDeps);
    } catch (error: unknown) {
      deps.logger.error('Failed to sync invoice on accessorial.updated', {
        loadId: data.loadId,
        accessorialId: data.accessorialId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await deps.eventBus.subscribe('accessorial.deleted', 'invoices-service', async (data) => {
    try {
      await syncInvoiceAccessorials(data.loadId, handlerDeps);
    } catch (error: unknown) {
      deps.logger.error('Failed to sync invoice on accessorial.deleted', {
        loadId: data.loadId,
        accessorialId: data.accessorialId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  deps.logger.info('Accessorial sync subscriber initialized');
};
