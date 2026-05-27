import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';
import type { StorageProvider } from '../../shared/storage/storageProvider';
import type { InvoiceRepoPort, InvoiceLoadQueryPort } from '../types/invoiceTypes';
import type { OrgSettingsQueryPort } from '../types/readinessTypes';
import type { PdfGenerationPort } from '../types/invoiceTemplateTypes';
import { buildInvoicePdfData } from './invoicePdfDataBuilder';

interface PdfGenerationSubscriberDeps {
  eventBus: EventBus;
  invoiceRepo: InvoiceRepoPort;
  loadQuery: InvoiceLoadQueryPort;
  orgSettingsQuery: OrgSettingsQueryPort;
  pdfService: PdfGenerationPort;
  storageProvider: StorageProvider;
  logger: Logger;
}

/**
 * Subscribes to `invoice.draft.created` and generates + persists the invoice
 * PDF. Decoupled from the creation paths so a slow Puppeteer call never blocks
 * invoice creation. Failure-tolerant: errors are logged but never rethrown —
 * recovery is via the Generate PDF button or the backfillInvoicePdfs script.
 */
export const initializeInvoicePdfGenerationSubscriber = async (
  deps: PdfGenerationSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe(
    'invoice.draft.created',
    'invoice-pdf-generation',
    async (data) => {
      try {
        await generateAndStoreInvoicePdf(data.invoiceId, data.organizationId, deps);
      } catch (error: unknown) {
        deps.logger.error('Invoice PDF generation failed; pdfUrl remains null', {
          invoiceId: data.invoiceId,
          organizationId: data.organizationId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  deps.logger.info('Invoice PDF generation subscriber initialized');
};

const generateAndStoreInvoicePdf = async (
  invoiceId: string,
  organizationId: string,
  deps: PdfGenerationSubscriberDeps,
): Promise<void> => {
  const invoice = await deps.invoiceRepo.findById(invoiceId, organizationId);

  if (invoice === null) {
    deps.logger.warn('Invoice not found for PDF generation; event likely raced a void', {
      invoiceId,
      organizationId,
    });
    return;
  }

  // Idempotency: cheap DB-level check. If pdfUrl is set we assume the artifact
  // is in storage. If storage gets out of sync, recovery is via Generate button
  // or backfill — not this hot path.
  if (invoice.pdfUrl !== null && invoice.pdfUrl !== undefined && invoice.pdfUrl !== '') {
    deps.logger.info('Invoice PDF already exists; skipping generation', {
      invoiceId,
      pdfUrl: invoice.pdfUrl,
    });
    return;
  }

  const pdfData = await buildInvoicePdfData(invoice, {
    loadQuery: deps.loadQuery,
    orgSettingsQuery: deps.orgSettingsQuery,
    logger: deps.logger,
  });

  const pdfBuffer = await deps.pdfService.generateInvoicePdf(pdfData);

  const storageKey = `invoices/${invoice.invoiceNumber}.pdf`;
  await deps.storageProvider.put(storageKey, pdfBuffer, 'application/pdf');

  await deps.invoiceRepo.updateStatus(invoice.id, organizationId, invoice.status, {
    pdfUrl: storageKey,
  });

  deps.logger.info('Invoice PDF generated and stored', {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    storageKey,
    bytes: pdfBuffer.length,
  });
};
