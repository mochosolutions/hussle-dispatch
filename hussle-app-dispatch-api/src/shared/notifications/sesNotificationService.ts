import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { createTransport } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type { Readable } from 'stream';
import type { Logger } from '../utils/logger';
import type { NotificationService } from './notificationService';

interface SesNotificationConfig {
  region: string;
}

const streamToBuffer = (stream: Readable): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });

/**
 * Builds a MIME message using nodemailer (handles attachments, HTML, etc.)
 * then sends it via SES SendRawEmail API.
 */
export const createSesNotificationService = (
  config: SesNotificationConfig,
  logger: Logger,
): NotificationService => {
  const sesClient = new SESClient({ region: config.region });

  // Nodemailer stream transport for MIME construction only (no actual send)
  const mimeBuilder = createTransport({ streamTransport: true });

  return {
    sendEmail: async (params) => {
      const ccList = params.cc?.filter((email) => email.length > 0) ?? [];
      const hasCc = ccList.length > 0;

      const mailOptions: Mail.Options = {
        from: params.from,
        to: params.to,
        ...(hasCc ? { cc: ccList } : {}),
        replyTo: params.replyTo,
        subject: params.subject,
        html: params.html,
        attachments: params.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      };

      // Build the raw MIME message via stream transport
      const info = await mimeBuilder.sendMail(mailOptions);
      const rawMessage = await streamToBuffer(info.message as Readable);

      // SES destinations must include every recipient (to + cc)
      const destinations = [params.to, ...ccList];

      // Send via SES
      const command = new SendRawEmailCommand({
        RawMessage: { Data: rawMessage },
        Source: params.from,
        Destinations: destinations,
      });

      const result = await sesClient.send(command);

      logger.info('SES email sent', {
        messageId: result.MessageId,
        to: params.to,
        ccCount: ccList.length,
        subject: params.subject,
      });
    },
  };
};
