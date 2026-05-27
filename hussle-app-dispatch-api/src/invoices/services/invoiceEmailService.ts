import type { Logger } from '../../shared/utils/logger';
import type { NotificationService, EmailAttachment } from '../../shared/notifications/notificationService';
import type { InvoiceRepoPort, InvoiceLoadQueryPort } from '../types/invoiceTypes';
import type { PdfGenerationPort } from '../types/invoiceTemplateTypes';
import type { SendInvoiceEmailInput } from '../types/emailTypes';
import type { DocumentQueryPort } from '../types/documentPacketTypes';
import type { OrgSettingsQueryPort } from '../types/readinessTypes';
import type { StorageProvider } from '../../shared/storage/storageProvider';
import Decimal from 'decimal.js';
import { renderInvoiceEmail } from '@/shared/emails';
import { buildInvoicePdfData } from './invoicePdfDataBuilder';

interface InvoiceEmailServiceDeps {
  invoiceRepo: InvoiceRepoPort;
  loadQuery: InvoiceLoadQueryPort;
  orgSettingsQuery: OrgSettingsQueryPort;
  documentQuery: DocumentQueryPort;
  pdfService: PdfGenerationPort;
  storageProvider: StorageProvider;
  notificationService: NotificationService;
  logger: Logger;
}

export interface InvoiceEmailService {
  sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<void>;
}

export const createInvoiceEmailService = (
  deps: InvoiceEmailServiceDeps,
): InvoiceEmailService => ({
  sendInvoiceEmail: async (input: SendInvoiceEmailInput): Promise<void> => {
    const invoice = await deps.invoiceRepo.findById(input.invoiceId, input.organizationId);

    if (invoice === null) {
      throw new Error(`Invoice not found: ${input.invoiceId}`);
    }

    // Build PDF data and generate PDF
    const pdfData = await buildInvoicePdfData(invoice, {
      loadQuery: deps.loadQuery,
      orgSettingsQuery: deps.orgSettingsQuery,
      logger: deps.logger,
    });
    const pdfBuffer = await deps.pdfService.generateInvoicePdf(pdfData);

    // Persist the PDF to storage so it's available via /invoices/:id/pdf-download
    // after this send completes (and overwrites any earlier draft PDF at the
    // same key). Without this, sending an invoice would email the PDF but leave
    // invoice.pdfUrl null — the Documents tab would never show it.
    const pdfStorageKey = `invoices/${invoice.invoiceNumber}.pdf`;
    await deps.storageProvider.put(pdfStorageKey, pdfBuffer, 'application/pdf');

    // Collect load document attachments
    const loadDocs = await deps.documentQuery.findConfirmedByEntity('load', invoice.loadId);
    const attachments: EmailAttachment[] = [
      {
        filename: `Invoice_${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ];

    for (const doc of loadDocs) {
      try {
        const content = await deps.storageProvider.getFile(doc.s3Key);
        attachments.push({
          filename: doc.fileName,
          content,
          contentType: doc.mimeType ?? 'application/octet-stream',
        });
      } catch (error: unknown) {
        deps.logger.warn('Failed to fetch document for email attachment', {
          documentId: doc.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Render email via hussle-emails React Email templates
    const replyToEmail = input.replyToEmail ?? input.fromEmail;
    const totalDecimal = new Decimal(String(invoice.totalAmount));
    const carrierName = invoice.carrier?.name ?? 'Unknown Carrier';

    const senderName = invoice.load.organization?.name ?? carrierName;

    const { subject, html } = await renderInvoiceEmail({
      invoiceNumber: invoice.invoiceNumber,
      loadNumber: invoice.load.loadNumber,
      carrierName,
      totalAmount: `$${totalDecimal.toFixed(2)}`,
      dueDate: invoice.dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      paymentTerms: invoice.paymentTerms,
      replyToEmail,
      invoiceType: invoice.type,
      senderName,
    });

    // Send via the shared notification service
    await deps.notificationService.sendEmail({
      from: input.fromEmail,
      to: input.recipientEmail,
      cc: input.ccEmails !== undefined && input.ccEmails.length > 0 ? input.ccEmails : undefined,
      replyTo: input.replyToEmail,
      subject,
      html,
      attachments,
    });

    // Update invoice status — include pdfUrl so the just-generated PDF is what
    // /invoices/:id/pdf-download resolves to (instead of any older draft PDF
    // that was stored at the same key when the invoice was first created).
    await deps.invoiceRepo.updateStatus(invoice.id, input.organizationId, 'SENT', {
      sentAt: new Date(),
      sentTo: input.recipientEmail,
      sentToEmail: input.recipientEmail,
      deliveryMethod: 'PLATFORM_EMAIL',
      pdfUrl: pdfStorageKey,
    });

    deps.logger.info('Invoice email sent', {
      invoiceId: invoice.id,
      recipientEmail: input.recipientEmail,
      attachmentCount: attachments.length,
    });
  },
});
