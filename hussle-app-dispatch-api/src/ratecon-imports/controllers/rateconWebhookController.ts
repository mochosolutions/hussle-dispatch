import type { Request, Response } from 'express';

import { ForbiddenError, NotFoundError, ValidationError } from '@/shared/errors';
import { sendSingle } from '@/shared/responseEnvelope';
import type { Logger } from '@/shared/utils/logger';

import type { MailpitClient } from '../adapters/mailpitClient';
import type { InboundEmailIngestor, InboundPdf } from '../services/inboundEmailService';

const RATECON_RECIPIENT = /ratecon\+[^@]+@/i;

export interface RateconWebhookControllerDeps {
  ingestor: InboundEmailIngestor;
  webhookSecret: string;
  logger: Logger;
  mailpitClient?: MailpitClient;
}

export interface RateconWebhookControllers {
  sesInbound: (req: Request, res: Response) => Promise<void>;
  mailpitInbound: (req: Request, res: Response) => Promise<void>;
}

interface SesInboundBody {
  recipient: string;
  from?: string | null;
  messageId?: string | null;
  subject?: string | null;
  attachments?: { fileName: string; contentType: string; contentBase64: string }[];
}

interface MailpitWebhookBody {
  ID: string;
  To?: { Address?: string }[];
}

export const createRateconWebhookControllers = (
  deps: RateconWebhookControllerDeps,
): RateconWebhookControllers => ({
  sesInbound: async (req, res) => {
    if (req.header('x-webhook-secret') !== deps.webhookSecret) {
      throw new ForbiddenError('Invalid webhook secret');
    }
    const body = req.body as SesInboundBody;
    if (typeof body.recipient !== 'string') {
      throw new ValidationError('recipient is required');
    }
    const pdfs: InboundPdf[] = (body.attachments ?? [])
      .filter((a) => a.contentType === 'application/pdf')
      .map((a) => ({ fileName: a.fileName, bytes: Buffer.from(a.contentBase64, 'base64') }));

    const result = await deps.ingestor.ingest({
      recipient: body.recipient,
      from: body.from ?? null,
      messageId: body.messageId ?? null,
      subject: body.subject ?? null,
      pdfs,
    });
    sendSingle(res, result);
  },

  mailpitInbound: async (req, res) => {
    const client = deps.mailpitClient;
    if (client === undefined) {
      throw new NotFoundError('Mailpit inbound is not enabled');
    }
    const body = req.body as MailpitWebhookBody;
    const recipient = (body.To ?? [])
      .map((t) => t.Address ?? '')
      .find((addr) => RATECON_RECIPIENT.test(addr));

    if (recipient === undefined) {
      // Mailpit catches outbound mail too — ignore anything not addressed to ratecon+.
      sendSingle(res, { accepted: 0, skippedReason: 'not_a_ratecon_recipient' });
      return;
    }

    const message = await client.fetchMessage(body.ID);
    const pdfAttachments = message.attachments.filter(
      (a) => a.contentType === 'application/pdf',
    );
    const pdfs: InboundPdf[] = await Promise.all(
      pdfAttachments.map(async (a) => ({
        fileName: a.fileName,
        bytes: await client.fetchPart(message.id, a.partId),
      })),
    );

    const result = await deps.ingestor.ingest({
      recipient,
      from: message.fromAddress,
      messageId: message.messageId,
      subject: message.subject,
      pdfs,
    });
    sendSingle(res, result);
  },
});
