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
import {
  renderInvoiceEmail,
  renderStatusChangeEmail,
  renderCheckCallEmail,
} from '@hussle/emails';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const invoiceData = {
  invoiceNumber: 'INV-2026-0042',
  loadNumber: 'LD-1087',
  carrierName: 'ABC Trucking',
  totalAmount: `$${new Decimal('4250.00').toFixed(2)}`,
  dueDate: new Date('2026-04-15').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  paymentTerms: 'Net 30',
  replyToEmail: 'invoices@hussledispatch.com',
};

const statusChangeData = {
  loadNumber: 'LD-1087',
  fromStatus: 'IN_TRANSIT',
  toStatus: 'DELIVERED',
  trackingUrl: 'https://track.hussle.app/t/abc123',
};

const checkCallData = {
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
  const invoice = await renderInvoiceEmail(invoiceData);
  await transport.sendMail({
    from: 'invoices@hussledispatch.com',
    to: 'broker@example.com',
    replyTo: 'invoices@hussledispatch.com',
    subject: invoice.subject,
    html: invoice.html,
  });
  // eslint-disable-next-line no-console -- one-off preview script
  console.log('[1/3] Invoice email sent');

  // 2. Status change email
  const statusChange = await renderStatusChangeEmail(statusChangeData);
  await transport.sendMail({
    from: 'notifications@hussle.app',
    to: 'broker@example.com',
    subject: statusChange.subject,
    html: statusChange.html,
  });
  // eslint-disable-next-line no-console -- one-off preview script
  console.log('[2/3] Status change email sent');

  // 3. Check call email
  const checkCall = await renderCheckCallEmail(checkCallData);
  await transport.sendMail({
    from: 'notifications@hussle.app',
    to: 'broker@example.com',
    subject: checkCall.subject,
    html: checkCall.html,
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
