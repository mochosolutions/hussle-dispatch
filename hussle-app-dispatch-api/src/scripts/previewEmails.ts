/**
 * One-off script to render all email templates and send them to Mailpit
 * for visual inspection.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/scripts/previewEmails.ts
 *
 * Prerequisites:
 *   - Mailpit running on localhost:1025 (SMTP) / localhost:8025 (UI)
 *   - `docker compose up mailpit`
 */
import { createTransport } from 'nodemailer';
import Decimal from 'decimal.js';
import { statusChangeEmailSubject, statusChangeEmailHtml } from '../notifications/templates/statusChangeEmail';
import { checkCallEmailSubject, checkCallEmailHtml } from '../notifications/templates/checkCallEmail';
import type { StatusChangeContext } from '../notifications/types/notificationTypes';
import type { CheckCallContext } from '../notifications/types/notificationTypes';

// ---------------------------------------------------------------------------
// Invoice email builder — copied from invoiceEmailService.ts because it is
// not exported. This is a read-only preview script; the canonical builder
// stays in the service file.
// ---------------------------------------------------------------------------

interface InvoiceEmailTemplateData {
  invoiceNumber: string;
  loadNumber: string;
  totalAmount: unknown;
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

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const invoiceData: InvoiceEmailTemplateData = {
  invoiceNumber: 'INV-2026-0042',
  loadNumber: 'LD-1087',
  totalAmount: new Decimal('4250.00'),
  dueDate: new Date('2026-04-15'),
  paymentTerms: 'Net 30',
  replyToEmail: 'invoices@hussledispatch.com',
};

const statusChangeCtx: StatusChangeContext = {
  loadNumber: 'LD-1087',
  fromStatus: 'IN_TRANSIT',
  toStatus: 'DELIVERED',
  trackingUrl: 'https://track.hussle.app/t/abc123',
};

const checkCallCtx: CheckCallContext = {
  loadNumber: 'LD-1087',
  location: 'Memphis, TN — I-40 Mile Marker 12',
  status: 'On schedule',
  eta: 'March 23, 2026 at 2:00 PM CST',
  trackingUrl: 'https://track.hussle.app/t/abc123',
};

// ---------------------------------------------------------------------------
// Send to Mailpit
// ---------------------------------------------------------------------------

const MAILPIT_HOST = 'localhost';
const MAILPIT_PORT = 1025;

const run = async (): Promise<void> => {
  const transport = createTransport({
    host: MAILPIT_HOST,
    port: MAILPIT_PORT,
    secure: false,
  });

  // 1. Invoice email
  await transport.sendMail({
    from: 'invoices@hussledispatch.com',
    to: 'broker@example.com',
    replyTo: 'invoices@hussledispatch.com',
    subject: `Invoice from ABC Trucking — Load #${invoiceData.loadNumber}`,
    html: buildInvoiceEmailHtml(invoiceData),
  });
  // eslint-disable-next-line no-console -- one-off preview script
  console.log('[1/3] Invoice email sent');

  // 2. Status change email
  await transport.sendMail({
    from: 'notifications@hussle.app',
    to: 'broker@example.com',
    subject: statusChangeEmailSubject(statusChangeCtx),
    html: statusChangeEmailHtml(statusChangeCtx),
  });
  // eslint-disable-next-line no-console -- one-off preview script
  console.log('[2/3] Status change email sent');

  // 3. Check call email
  await transport.sendMail({
    from: 'notifications@hussle.app',
    to: 'broker@example.com',
    subject: checkCallEmailSubject(checkCallCtx),
    html: checkCallEmailHtml(checkCallCtx),
  });
  // eslint-disable-next-line no-console -- one-off preview script
  console.log('[3/3] Check call email sent');

  // eslint-disable-next-line no-console -- one-off preview script
  console.log('\nAll 3 emails sent to Mailpit. Open http://localhost:8025 to inspect.');
  transport.close();
};

run().catch((error: unknown) => {
  // eslint-disable-next-line no-console -- one-off preview script
  console.error('Failed to send preview emails:', error);
  process.exitCode = 1;
});
