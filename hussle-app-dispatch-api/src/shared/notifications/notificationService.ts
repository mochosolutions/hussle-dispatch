/**
 * Notification service interface.
 * Implementations: consoleNotificationService (dev), SES (future production).
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface NotificationService {
  sendEmail(params: {
    to: string;
    cc?: string[];
    from: string;
    replyTo?: string;
    subject: string;
    html: string;
    attachments?: EmailAttachment[];
  }): Promise<void>;
}
