import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { InvoiceRepoPort, InvoiceLoadQueryPort } from '../types/invoiceTypes';
import type { PdfGenerationPort } from '../types/invoiceTemplateTypes';
import type { OrgSettingsQueryPort } from '../types/readinessTypes';
import type { StorageProvider } from '@/shared/storage/storageProvider';
import type { Logger } from '@/shared/utils/logger';
import { NotFoundError } from '@/shared/errors';
import { streamFileResponse } from '@/shared/storage/streamFileResponse';
import { buildInvoicePdfData } from '../services/invoicePdfDataBuilder';
import { pdfMapper } from './mappers/pdfMapper';

interface PdfControllerDeps {
  invoiceRepo: InvoiceRepoPort;
  loadQuery: InvoiceLoadQueryPort;
  orgSettingsQuery: OrgSettingsQueryPort;
  pdfService: PdfGenerationPort;
  storageProvider: StorageProvider;
  logger: Logger;
}

export interface PdfControllers {
  generatePdf: RequestHandler;
  previewPdf: RequestHandler;
  downloadPdf: RequestHandler;
}

const buildDownloadPath = (invoiceId: string): string =>
  `/api/v1/invoices/${invoiceId}/pdf-download`;

export const createPdfControllers = (deps: PdfControllerDeps): PdfControllers => ({
  generatePdf: async (req: Request, res: Response): Promise<void> => {
    const { invoiceId, organizationId } = pdfMapper(req);
    const invoice = await deps.invoiceRepo.findById(invoiceId, organizationId);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    const pdfData = await buildInvoicePdfData(invoice, {
      loadQuery: deps.loadQuery,
      orgSettingsQuery: deps.orgSettingsQuery,
      logger: deps.logger,
    });
    const pdfBuffer = await deps.pdfService.generateInvoicePdf(pdfData);

    const storageKey = `invoices/${invoice.invoiceNumber}.pdf`;
    await deps.storageProvider.put(storageKey, pdfBuffer, 'application/pdf');

    // Invoice.pdfUrl stores the storage KEY (not a URL). URL resolution happens
    // inside the scoped /invoices/:id/pdf-download endpoint at request time.
    await deps.invoiceRepo.updateStatus(invoiceId, organizationId, invoice.status, {
      pdfUrl: storageKey,
    });

    // Return a relative path the UI can use to download via the scoped endpoint.
    // The storage key is intentionally NOT exposed in the response — clients
    // never receive raw storage paths.
    sendSingle(res, { downloadUrl: buildDownloadPath(invoiceId) });
  },

  downloadPdf: async (req: Request, res: Response): Promise<void> => {
    const { invoiceId, organizationId } = pdfMapper(req);
    const invoice = await deps.invoiceRepo.findById(invoiceId, organizationId);

    // 404 (not 403) on cross-org / missing — don't leak existence.
    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.pdfUrl === null || invoice.pdfUrl === undefined || invoice.pdfUrl === '') {
      throw new NotFoundError('Invoice PDF has not been generated yet');
    }

    deps.logger.info('Invoice PDF download', {
      invoiceId,
      organizationId,
      invoiceNumber: invoice.invoiceNumber,
    });

    await streamFileResponse({
      res,
      storageProvider: deps.storageProvider,
      key: invoice.pdfUrl,
      displayName: `Invoice_${invoice.invoiceNumber}.pdf`,
      disposition: 'inline',
    });
  },

  previewPdf: async (req: Request, res: Response): Promise<void> => {
    const { invoiceId, organizationId } = pdfMapper(req);
    const invoice = await deps.invoiceRepo.findById(invoiceId, organizationId);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    const pdfData = await buildInvoicePdfData(invoice, {
      loadQuery: deps.loadQuery,
      orgSettingsQuery: deps.orgSettingsQuery,
      logger: deps.logger,
    });
    const pdfBuffer = await deps.pdfService.generateInvoicePdf(pdfData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice_${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  },
});
