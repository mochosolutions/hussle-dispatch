/**
 * Fire a fixture rate-con PDF into the inbound-email pipeline with one command.
 *
 * Sends an email (PDF attached) to ratecon+<orgId>@<domain> via the local
 * Mailpit SMTP server. Mailpit catches it and POSTs its webhook to the API's
 * /api/v1/webhooks/mailpit-inbound endpoint, which ingests the PDF exactly as a
 * production SES inbound would — creating a PendingRateconImport and kicking off
 * extraction. This is the local stand-in for SES + Lambda.
 *
 * Prerequisites (local dev):
 *   - `docker compose up -d` (dispatch-api, python-service, mailpit all running)
 *   - API started with RATECON_DEV_MAILPIT_INBOUND=true (mounts the dev route)
 *   - Mailpit started with MP_WEBHOOK_URL pointing at the API (set in compose)
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/send-test-ratecon-email.ts <orgId> [pdfPath] [fromEmail]
 *
 * Find your orgId by logging into the UI and copying it from any org-scoped
 * request, or from the database (SELECT id FROM "Organization").
 */
import { readFileSync } from 'fs';
import { basename, resolve } from 'path';

import { createTransport } from 'nodemailer';

const DEFAULT_FIXTURE = resolve(
  __dirname,
  '../../hussle-app-dispatch-py/tests/fixtures/ratecon/CARRCONFIRM.pdf',
);

const orgId = process.argv[2];
if (orgId === undefined) {
  throw new Error(
    'Usage: send-test-ratecon-email.ts <orgId> [pdfPath] [fromEmail]\n' +
      '  <orgId>    organization id the rate-con belongs to (required)\n' +
      '  [pdfPath]  PDF to attach (default: CARRCONFIRM.pdf fixture)\n' +
      '  [fromEmail] sender address (default: dispatch@broker-test.com)',
  );
}

const pdfPath = process.argv[3] ?? DEFAULT_FIXTURE;
const fromEmail = process.argv[4] ?? 'dispatch@broker-test.com';

const host = process.env['SMTP_HOST'] ?? 'localhost';
const port = parseInt(process.env['SMTP_PORT'] ?? '1025', 10);
const secure = (process.env['SMTP_SECURE'] ?? 'false') === 'true';
const inboundDomain = process.env['RATECON_INBOUND_DOMAIN'] ?? 'notify.localhost';

const recipient = `ratecon+${orgId}@${inboundDomain}`;
const fileName = basename(pdfPath);
const pdfBytes = readFileSync(pdfPath);

const main = async (): Promise<void> => {
  const transport = createTransport({ host, port, secure });

  const info = await transport.sendMail({
    from: fromEmail,
    to: recipient,
    subject: `Rate Confirmation — ${fileName}`,
    text: 'Automated test rate-con. PDF attached.',
    attachments: [{ filename: fileName, content: pdfBytes, contentType: 'application/pdf' }],
  });

  console.log('Inbound test rate-con sent via Mailpit SMTP:');
  console.log({
    smtp: `${host}:${port}`,
    to: recipient,
    from: fromEmail,
    attachment: fileName,
    bytes: pdfBytes.length,
    messageId: String(info.messageId),
  });
  console.log(
    '\nMailpit will POST its webhook to /api/v1/webhooks/mailpit-inbound and the\n' +
      'import should appear at /ratecons (RECEIVED -> EXTRACTING -> PENDING_REVIEW).\n' +
      'If nothing appears: confirm the API has RATECON_DEV_MAILPIT_INBOUND=true and\n' +
      'Mailpit has MP_WEBHOOK_URL set (check docker-compose.yml).',
  );
};

void main();
