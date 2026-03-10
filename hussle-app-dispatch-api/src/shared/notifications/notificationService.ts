/**
 * Notification service interface.
 * Implementations: consoleNotificationService (dev), SES (future production).
 */
export interface NotificationService {
  sendEmail(params: {
    to: string;
    from: string;
    subject: string;
    html: string;
    attachments?: { filename: string; content: string }[];
  }): Promise<void>;
}
