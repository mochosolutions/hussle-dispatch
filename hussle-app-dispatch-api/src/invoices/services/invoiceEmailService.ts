import type { Logger } from '../../shared/utils/logger';
import type { NotificationService, EmailAttachment } from '../../shared/notifications/notificationService';
import type { InvoiceRepoPort, InvoiceLoadQueryPort } from '../types/invoiceTypes';
import type { PdfGenerationPort } from '../types/invoiceTemplateTypes';
import type { SendInvoiceEmailInput } from '../types/emailTypes';
import type { DocumentQueryPort } from '../types/documentPacketTypes';
import type { OrgSettingsQueryPort } from '../types/readinessTypes';
import type { StorageProvider } from '../../shared/storage/storageProvider';
import Decimal from 'decimal.js';
import { buildInvoicePdfData } from './invoicePdfDataBuilder';

interface InvoiceEmailTemplateData {
  invoiceNumber: string;
  loadNumber: string;
  totalAmount: unknown; // Decimal from Prisma
  dueDate: Date;
  paymentTerms: string;
  replyToEmail: string;
}

const formatCurrency = (value: unknown): string => {
  const num = new Decimal(String(value));
  return `$${num.toFixed(2)}`;
};

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const buildInvoiceEmailHtml = (data: InvoiceEmailTemplateData): string => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background-color:#1a237e;padding:24px 32px;">
            <h1 style="color:#ffffff;margin:0;font-size:20px;">Invoice #${data.invoiceNumber}</h1>
            <p style="color:#c5cae9;margin:4px 0 0;font-size:14px;">Load #${data.loadNumber}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 20px;font-size:15px;color:#333333;">
              Please find the invoice PDF and supporting documents attached to this email.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:4px;margin-bottom:24px;">
              <tr style="background-color:#fafafa;">
                <td style="padding:12px 16px;font-size:13px;color:#666666;border-bottom:1px solid #e0e0e0;">Total Amount</td>
                <td style="padding:12px 16px;font-size:15px;font-weight:bold;color:#1a237e;border-bottom:1px solid #e0e0e0;text-align:right;">${formatCurrency(data.totalAmount)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#666666;border-bottom:1px solid #e0e0e0;">Due Date</td>
                <td style="padding:12px 16px;font-size:14px;color:#333333;border-bottom:1px solid #e0e0e0;text-align:right;">${formatDate(data.dueDate)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#666666;">Payment Terms</td>
                <td style="padding:12px 16px;font-size:14px;color:#333333;text-align:right;">${data.paymentTerms}</td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#999999;">
              If you have any questions regarding this invoice, please reply to this email
              or contact us at <a href="mailto:${data.replyToEmail}" style="color:#1a237e;">${data.replyToEmail}</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#fafafa;padding:16px 32px;border-top:1px solid #e0e0e0;">
            <p style="margin:0;font-size:12px;color:#999999;text-align:center;">
              Sent via Hussle Dispatch
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

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
    const invoice = await deps.invoiceRepo.findById(input.invoiceId);

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

    // Send via the shared notification service
    await deps.notificationService.sendEmail({
      from: input.fromEmail,
      to: input.recipientEmail,
      replyTo: input.replyToEmail,
      subject: input.subject,
      html: buildInvoiceEmailHtml({
        invoiceNumber: invoice.invoiceNumber,
        loadNumber: invoice.load.loadNumber,
        totalAmount: invoice.totalAmount,
        dueDate: invoice.dueDate,
        paymentTerms: invoice.paymentTerms,
        replyToEmail: input.replyToEmail ?? input.fromEmail,
      }),
      attachments,
    });

    // Update invoice status
    await deps.invoiceRepo.updateStatus(invoice.id, 'SENT', {
      sentAt: new Date(),
      sentTo: input.recipientEmail,
      sentToEmail: input.recipientEmail,
      deliveryMethod: 'PLATFORM_EMAIL',
    });

    deps.logger.info('Invoice email sent', {
      invoiceId: invoice.id,
      recipientEmail: input.recipientEmail,
      attachmentCount: attachments.length,
    });
  },
});
