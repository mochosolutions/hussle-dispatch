import { createTransport } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type { Logger } from '../utils/logger';
import type { NotificationService } from './notificationService';

interface SmtpNotificationConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

/**
 * SMTP implementation of NotificationService.
 * Sends emails via a real SMTP server (e.g. Mailpit for local dev).
 */
export const createSmtpNotificationService = (
  config: SmtpNotificationConfig,
  logger: Logger,
): NotificationService => {
  const transport = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    ...(config.user && config.pass
      ? { auth: { user: config.user, pass: config.pass } }
      : {}),
  });

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

      const info = await transport.sendMail(mailOptions);

      logger.info('SMTP email sent', {
        messageId: String(info.messageId),
        to: params.to,
        ccCount: ccList.length,
        subject: params.subject,
      });
    },
  };
};
