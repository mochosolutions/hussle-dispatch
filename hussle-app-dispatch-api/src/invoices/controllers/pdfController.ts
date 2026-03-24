import type { Request, Response, RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import type { InvoiceRepoPort, InvoiceLoadQueryPort } from '../types/invoiceTypes';
import type { PdfGenerationPort } from '../types/invoiceTemplateTypes';
import type { OrgSettingsQueryPort } from '../types/readinessTypes';
import type { StorageProvider } from '@/shared/storage/storageProvider';
import type { Logger } from '@/shared/utils/logger';
import { NotFoundError } from '@/shared/errors';
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
}

export const createPdfControllers = (deps: PdfControllerDeps): PdfControllers => ({
  generatePdf: async (req: Request, res: Response): Promise<void> => {
    const { invoiceId } = pdfMapper(req);
    const invoice = await deps.invoiceRepo.findById(invoiceId);

    if (invoice === null) {
      throw new NotFoundError('Invoice not found');
    }

    const pdfData = await buildInvoicePdfData(invoice, {
      loadQuery: deps.loadQuery,
      orgSettingsQuery: deps.orgSettingsQuery,
      logger: deps.logger,
    });
    const pdfBuffer = await deps.pdfService.generateInvoicePdf(pdfData);

    // Store PDF and retrieve its URL
    const s3Key = `invoices/${invoice.invoiceNumber}.pdf`;
    const pdfUrl = await deps.storageProvider.put(s3Key, pdfBuffer, 'application/pdf');

    // Persist the pdfUrl on the invoice using updateStatus with current status
    await deps.invoiceRepo.updateStatus(invoiceId, invoice.status, { pdfUrl });

    sendSingle(res, { pdfUrl });
  },

  previewPdf: async (req: Request, res: Response): Promise<void> => {
    const { invoiceId } = pdfMapper(req);
    const invoice = await deps.invoiceRepo.findById(invoiceId);

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
